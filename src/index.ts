import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import pino from "pino";
import events from "node:events";
import type http from "node:http";
import { createDb, Database, migrateToLatest } from "./db";
import { Firehose } from "@atproto/sync";
import {
  BidirectionalResolver,
  createBidirectionalResolver,
  createIdResolver,
} from "./id-resolver";
import { OAuthClient } from "@atproto/oauth-client-node";
import { createClient } from "./auth/client";
import { createIngester } from "./ingester";
import { createRouter } from "./routes";
import * as OpenApiValidator from "express-openapi-validator";
import path from "path";
import { Agent } from "@atproto/api";
import { IncomingMessage, ServerResponse } from "node:http";
import { getIronSession } from "iron-session";
import { BaseRequest } from "./middleware/auth";

export type Session = { did: string };

// Application state passed to the router and elsewhere
export type AppContext = {
  db: Database;
  ingester: Firehose;
  logger: pino.Logger;
  oauthClient: OAuthClient;
  resolver: BidirectionalResolver;
};

// Load environment variables
dotenv.config();

// Helper function to get the Atproto Agent for the active session
async function createAgent(
  req: BaseRequest,
  res: ServerResponse<IncomingMessage>,
) {
  const session = await getIronSession<Session>(req, res, {
    cookieName: "sid",
    password: process.env.COOKIE_SECRET,
  });
  if (!session.did) return null;
  try {
    const oauthSession = await req.context.oauthClient.restore(session.did);
    return oauthSession ? new Agent(oauthSession) : null;
  } catch (err) {
    req.context.logger.warn({ err }, "oauth restore failed");
    await session.destroy();
    return null;
  }
}

export class Server {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public context: AppContext,
  ) {}

  static async create() {
    const NODE_ENV = process.env.NODE_ENV || "development";
    const HOST = process.env.HOST || "localhost";
    const PORT = parseInt(process.env.PORT || "3000", 10);
    const DB_PATH = process.env.DB_PATH || ":memory:";
    const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

    const logger = pino({ name: "server start" });

    // Set up the SQLite database
    const db = createDb(DB_PATH);
    await migrateToLatest(db);

    const oauthClient = await createClient(db, PORT);
    const baseIdResolver = createIdResolver();
    const ingester = createIngester(db, baseIdResolver);
    const resolver = createBidirectionalResolver(baseIdResolver);

    // Subscribe to events on the firehose
    ingester.start();

    const app = express();
    app.set("trust proxy", true);

    // Middleware
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    app.use(helmet());
    app.use(
      cors({
        origin: CORS_ORIGIN,
        credentials: true,
      }),
    );

    const context: AppContext = {
      db,
      ingester,
      logger,
      oauthClient,
      resolver,
    };

    // Make context available in request
    app.use(
      async (req: BaseRequest, res: ServerResponse<IncomingMessage>, next) => {
        // Create the atproto utilities
        const agent = await createAgent(req, res);

        (req as any).context = context;
        (req as any).agent = agent;
        next();
      },
    );

    const spec = path.join(__dirname, "openapi.yaml");
    app.use("/spec", express.static(spec));

    app.use(
      OpenApiValidator.middleware({
        apiSpec: path.join(__dirname, "openapi.yaml"),
        validateRequests: true,
        validateResponses: true,
      }),
    );

    // Routes
    const router = createRouter(context);
    app.use(router);

    // Error handling middleware
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: express.NextFunction,
      ) => {
        console.error("Error:", err);
        res.status(500).json({
          error: "Internal server error",
          message:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      },
    );

    // Bind our server to the port
    const server = app.listen(PORT);
    await events.once(server, "listening");
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

    return new Server(app, server, context);
  }

  async close() {
    this.context.logger.info("sigint received, shutting down");
    await this.context.ingester.destroy();
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.context.logger.info("server closed");
        resolve();
      });
    });
  }
}

const run = async () => {
  const server = await Server.create();

  const onCloseSignal = async () => {
    setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
    await server.close();
    process.exit();
  };

  process.on("SIGINT", onCloseSignal);
  process.on("SIGTERM", onCloseSignal);
};

run();
