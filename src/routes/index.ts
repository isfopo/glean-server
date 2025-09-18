import type { IncomingMessage, ServerResponse } from "node:http";
import { Agent } from "@atproto/api";
import express from "express";
import { getIronSession } from "iron-session";
import type { AppContext } from "../index";
import { authRoutes } from "./auth";
import { itemRoutes } from "./items";
import { userRoutes } from "./users";

type Session = { did: string };

// Helper function for defining routes
const handler =
  (fn: express.Handler) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };

// Helper function to get the Atproto Agent for the active session
async function getSessionAgent(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext,
) {
  const session = await getIronSession<Session>(req, res, {
    cookieName: "sid",
    password: process.env.COOKIE_SECRET,
  });
  if (!session.did) return null;
  try {
    const oauthSession = await ctx.oauthClient.restore(session.did);
    return oauthSession ? new Agent(oauthSession) : null;
  } catch (err) {
    ctx.logger.warn({ err }, "oauth restore failed");
    await session.destroy();
    return null;
  }
}

export const createRouter = (ctx: AppContext) => {
  const router = express.Router();

  // Health check endpoint
  router.get("/health", (_, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // OAuth metadata
  router.get(
    "/client-metadata.json",
    handler((_req, res) => {
      return res.json(ctx.oauthClient.clientMetadata);
    }),
  );

  // Routes
  router.use("/api/items", itemRoutes);
  router.use("/api/users", userRoutes);
  router.use("/api/auth", authRoutes);

  // Lexicon endpoint to serve our schemas
  router.get("/api/lexicons/:id", (req, res) => {
    const { id } = req.params;
    try {
      const lexicon = (req as any).repository.getLexicon(id);
      if (!lexicon) {
        return res.status(404).json({ error: "Lexicon not found" });
      }
      res.json(lexicon);
    } catch (error) {
      res.status(500).json({ error: "Failed to load lexicon" });
    }
  });

  // 404 handler
  router.use((_, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return router;
};
