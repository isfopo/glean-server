import { Request, Response, NextFunction } from "express";
import { AppContext } from "..";
import { Agent, BskyAgent } from "@atproto/api";
import { getIronSession } from "iron-session";
import { User } from "#/types";

export type Session = { did: string };

export interface BaseRequest extends Request {
  context: AppContext;
  agent: Agent;
}

export interface AuthenticatedRequest extends BaseRequest {
  user?: User;
}

async function verifyAndAssociateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  // const authHeader = req.headers["authorization"];
  // const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  // if (!token) {
  //   res.status(401).json({ error: "Access token required" });
  //   return;
  // }
  // const agent = new BskyAgent({
  //   service: "https:bsky.social",
  // });

  try {
    //   const { db } = req.context;
    //   const profile = await agent.getProfile({ actor: "self" });
    //   const { did, handle } = profile.data;

    //   let user: User | undefined = await db
    //     .selectFrom("user")
    //     .where("did", "=", did)
    //     .executeTakeFirst();

    //   if (!user) {
    //     await db.insertInto("user").values({
    //       did,
    //       handle,
    //       // points: 0,
    //     });

    //     user = await db
    //       .selectFrom("user")
    //       .where("did", "=", did)
    //       .executeTakeFirst();
    //   }

    //   req.user = { ...user };

    next();
  } catch (error) {
    throw new Error("Invalid JWT or user not found");
  }
}

// export const authenticateToken = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {

//   req.context.oauthClient;

//   if (!did) {
//     res.status(403).json({ error: "Invalid or expired token" });
//     return;
//   }

//   req.user = { did };
//   next();
// };

// export const optionalAuth = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];

//   if (token) {
//     const sessionService = new SessionService(req.context.db);

//     const did = await sessionService.validateSession(token);
//     if (did) {
//       req.user = { did };
//     }
//   }

//   next();
// };
