import express from "express";
import { authRoutes } from "./auth";
import { itemRoutes } from "./items";
import { userRoutes } from "./users";
import type { AppContext } from "../index";
import { getIronSession } from "iron-session";
import assert from "node:assert";

// Helper function for defining routes
export const handler =
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

export const createRouter = (ctx: AppContext) => {
  const router = express.Router();

  // Health check endpoint
  router.get("/health", (_, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0", // TODO: Update version number with version from package.json
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
