import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import pino from "pino";
import events from "node:events";
import type http from "node:http";
import { itemRoutes } from "./routes/items";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { Repository } from "./lib/repository";
import { createDb, Database, migrateToLatest } from "#/db";
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

export class Server {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public ctx: AppContext,
  ) {}

  static async create() {
    const { NODE_ENV, HOST, DB_PATH, CORS_ORIGIN } = process.env;
    const PORT = process.env.PORT || 3000;
    const logger = pino({ name: "server start" });

    // Set up the SQLite database
    const db = createDb(DB_PATH);
    await migrateToLatest(db);

    // Create the atproto utilities
    const oauthClient = await createClient(db);
    const baseIdResolver = createIdResolver();
    const ingester = createIngester(db, baseIdResolver);
    const resolver = createBidirectionalResolver(baseIdResolver);
    const ctx = {
      db,
      ingester,
      logger,
      oauthClient,
      resolver,
    };

    // Subscribe to events on the firehose
    ingester.start();

    const app = express();
    app.set("trust proxy", true);

    // Routes
    const router = createRouter(ctx);
    app.use(router);
    app.use((_req, res) => res.sendStatus(404));

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(helmet());

    // Bind our server to the port
    const server = app.listen(PORT);
    await events.once(server, "listening");
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

    app.use(
      cors({
        origin: CORS_ORIGIN || "http://localhost:3000",
        credentials: true,
      }),
    );
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Initialize repository
    const repository = new Repository();

    // Make repository available in request context
    app.use((req, res, next) => {
      (req as any).repository = repository;
      next();
    });

    // Routes
    app.use("/api/items", itemRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/auth", authRoutes);

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    });

    // Lexicon endpoint to serve our schemas
    app.get("/api/lexicons/:id", (req, res) => {
      const { id } = req.params;
      try {
        const lexicon = repository.getLexicon(id);
        if (!lexicon) {
          return res.status(404).json({ error: "Lexicon not found" });
        }
        res.json(lexicon);
      } catch (error) {
        res.status(500).json({ error: "Failed to load lexicon" });
      }
    });

    // Error handling middleware
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
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

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: "Not found" });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 ATproto server running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    return new Server(app, server, ctx);
  }

  async close() {
    this.ctx.logger.info("sigint received, shutting down");
    await this.ctx.ingester.destroy();
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.ctx.logger.info("server closed");
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
