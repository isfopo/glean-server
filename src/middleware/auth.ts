import { Request, Response, NextFunction } from "express";
import { AppContext } from "..";
import { Agent } from "@atproto/api";

export type Session = { did: string };

export interface BaseRequest extends Request {
  context: AppContext;
  agent: Agent;
}

export interface AuthenticatedRequest extends BaseRequest {
  user?: {
    did: string;
  };
}

// export const authenticateToken = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

//   if (!token) {
//     res.status(401).json({ error: "Access token required" });
//     return;
//   }

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
