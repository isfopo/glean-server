import { Router, Response, NextFunction } from "express";
import multer from "multer";
import { uploadStream, getPublicUrl } from "../lib/s3";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import { BskyAgent } from "@atproto/api";
import { AuthenticatedRequest } from "#/middleware/auth";

const router = Router();

// Configure multer for avatar/banner uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit for profile images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
});

// Get all users (public endpoint)
router.get("/", (req: any, res: any) => {
  try {
    const users = req.repository.getAllUsers();
    // Remove sensitive information
    const publicUsers = users.map((user) => ({
      did: user.did,
      handle: user.handle,
      profile: user.profile,
      createdAt: user.createdAt,
    }));

    res.json(publicUsers);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

// Get user profile by handle or DID
router.get("/:identifier", (req: any, res: any) => {
  try {
    const { identifier } = req.params;

    let user;
    if (identifier.startsWith("did:")) {
      user = req.repository.getUser(identifier);
    } else {
      user = req.repository.getUserByHandle(identifier);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return public profile information
    res.json({
      did: user.did,
      handle: user.handle,
      profile: user.profile,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Update user profile
router.put(
  "/profile",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { displayName, description } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const profileUpdate: any = {};

      if (displayName !== undefined) {
        profileUpdate.displayName = displayName;
      }

      if (description !== undefined) {
        profileUpdate.description = description;
      }

      const bucket = process.env.S3_BUCKET;
      if (!bucket) {
        throw new Error("S3_BUCKET environment variable not set");
      }

      if (files?.avatar?.[0]) {
        const key = uuidv4();
        const stream = Readable.from(files.avatar[0].buffer);
        await uploadStream(bucket, key, stream, files.avatar[0].mimetype);
        profileUpdate.avatar = getPublicUrl(bucket, key);
      }

      if (files?.banner?.[0]) {
        const key = uuidv4();
        const stream = Readable.from(files.banner[0].buffer);
        await uploadStream(bucket, key, stream, files.banner[0].mimetype);
        profileUpdate.banner = getPublicUrl(bucket, key);
      }

      const updatedUser = req.repository.updateUserProfile(
        req.user.did,
        profileUpdate,
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        did: updatedUser.did,
        handle: updatedUser.handle,
        profile: updatedUser.profile,
        createdAt: updatedUser.createdAt,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

// Delete user account
router.delete("/account", (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // In a real implementation, you'd want to:
    // 1. Delete all user's items
    // 2. Clean up any related data
    // 3. Invalidate all sessions
    // 4. Potentially add a grace period for recovery

    const deleted = req.repository.deleteUser(req.user.did);

    if (deleted) {
      // Also delete the current session
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (token) {
        req.repository.deleteSession(token);
      }

      res.json({ success: true });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export { router as userRoutes };
