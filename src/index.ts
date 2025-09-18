import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { itemRoutes } from "./routes/items";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { Repository } from "./lib/repository";
import { Database } from "#/db";
import { Firehose } from "@atproto/sync";

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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
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

export default app;
