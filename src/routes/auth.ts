import { Router, Response } from "express";
import { AuthenticatedRequest, BaseRequest } from "../middleware/auth";
import { IncomingMessage, ServerResponse } from "node:http";
import { AppContext } from "..";
import { getIronSession } from "iron-session";
import { handler } from ".";
import assert from "node:assert";
import { BskyAgent } from "@atproto/api";
import { User } from "#/types";
export type Session = { did: string };

const router = Router({});

const getAgent = (): BskyAgent => {
  return new BskyAgent({
    service: "https://bsky.social/",
  });
};

const decodeBasicAuthHeader = (
  auth: string,
): { handle: string; password: string } => {
  const [scheme, token] = auth.split(" ");
  assert(scheme === "Basic", "Invalid authorization scheme");
  const decoded = Buffer.from(token, "base64").toString("utf8");
  const [handle, password] = decoded.split(":");
  return { handle, password };
};

// router.get("/client-metadata.json", (req: BaseRequest, res: Response) => {
//   return res.json(req.context.oauthClient.clientMetadata);
// });

// Login
router.post("/login", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get handle and password from headers
    const { handle, password } = decodeBasicAuthHeader(
      req.headers["authorization"],
    );

    const agent = getAgent();
    const session = await agent.login({
      identifier: handle,
      password,
    });

    const { db } = req.context;
    const profile = await agent.getProfile({ actor: session.data.did });

    const { did } = profile.data;

    let user: User | undefined = await db
      .selectFrom("user")
      .where("did", "=", did)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      user = await db
        .insertInto("user")
        .values({
          did,
          handle,
          points: 0,
          createdAt: new Date().toUTCString(),
          updatedAt: new Date().toUTCString(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return res.json({ session: session.data });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// // OAuth callback to complete session creation
// router.get("/oauth/callback", async (req: BaseRequest, res: Response) => {
//   const params = new URLSearchParams(req.originalUrl.split("?")[1]);
//   const { oauthClient } = req.context;

//   try {
//     const { session } = await oauthClient.callback(params);
//     const clientSession = await getIronSession<Session>(req, res, {
//       cookieName: "sid",
//       password: process.env.COOKIE_SECRET,
//     });

//     clientSession.did = session.did;
//     await clientSession.save();
//     return res.json({ success: true, did: session.did });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ error: "Authentication failed" });
//   }
// });

// Get current session
router.get("/session", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await getIronSession<Session>(req, res, {
      cookieName: "sid",
      password: process.env.COOKIE_SECRET,
    });

    if (!session.did) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    res.json({ did: session.did });
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

// Delete session (logout)
router.post("/logout", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await getIronSession<Session>(req, res, {
      cookieName: "sid",
      password: process.env.COOKIE_SECRET,
    });

    await session.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

export { router as authRoutes };
