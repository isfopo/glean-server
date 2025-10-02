import { Router, Response } from "express";
import { AuthenticatedRequest, BaseRequest } from "../middleware/auth";
import { IncomingMessage, ServerResponse } from "node:http";
import { AppContext } from "..";
import { getIronSession } from "iron-session";
import { handler } from ".";
import assert from "node:assert";
export type Session = { did: string };

const router = Router({});

router.get("/client-metadata.json", (req: BaseRequest, res: Response) => {
  return res.json(req.context.oauthClient.clientMetadata);
});

// // Create account
// router.post(
//   "/createAccount",
//   async (req: AuthenticatedRequest, res: Response) => {
//     try {
//       const { handle, password, email, profile } = req.body;

//       if (!handle || !password) {
//         return res
//           .status(400)
//           .json({ error: "Handle and password are required" });
//       }

//       const userService = new UserService();

//       const {
//         accessJwt,
//         refreshJwt,
//         did,
//         handle: userHandle,
//         profile: userProfile,
//       } = await userService.createUserAccount({
//         handle,
//         password,
//         email,
//         profile,
//       });

//       res.status(201).json({
//         accessJwt,
//         refreshJwt,
//         handle: userHandle,
//         did: did,
//         profile: userProfile,
//       });
//     } catch (error: any) {
//       console.error("Create account error:", error);
//       if (error.message === "Handle already exists") {
//         return res.status(400).json({ error: error.message });
//       }
//       res.status(500).json({ error: "Failed to create account" });
//     }
//   },
// );

// Login
router.post("/login", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { identifier } = req.body;
    console.log("identifier:", identifier);

    if (!identifier) {
      return res.status(400).json({ error: "Identifier is required" });
    }

    const publicUrl = process.env.PUBLIC_URL;
    const port = process.env.PORT || "3000";
    const baseUrl = publicUrl || `http://127.0.0.1:${port}`;
    const redirectUri = `${baseUrl}/api/auth/oauth/callback`;

    const url = await req.context.oauthClient.authorize(identifier, {
      scope: "atproto transition:generic",
    });

    console.log("Redirecting to:", url.toString());
    return res.redirect(301, url.toString());
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// OAuth callback to complete session creation
router.get("/oauth/callback", async (req: BaseRequest, res: Response) => {
  const params = new URLSearchParams(req.originalUrl.split("?")[1]);
  const { oauthClient, logger } = req.context;

  try {
    const { session } = await oauthClient.callback(params);
    const clientSession = await getIronSession<Session>(req, res, {
      cookieName: "sid",
      password: process.env.COOKIE_SECRET,
    });
    assert(!clientSession.did, "session already exists");
    clientSession.did = session.did;
    await clientSession.save();
  } catch (err) {
    logger.error({ err }, "oauth callback failed");
    return res.redirect("/?error");
  }
  return res.redirect("/");
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
