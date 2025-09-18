import { Router, Response } from "express";
import multer from "multer";
import {
  AuthenticatedRequest,
  authenticateToken,
  optionalAuth,
} from "../middleware/auth";
import { GeoMarker } from "../types";
import { uploadStream, getPublicUrl } from "../lib/s3";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Create a new item
router.post(
  "/",
  authenticateToken,
  upload.single("photo"),
  async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Photo is required" });
      }

      const { geomarker, title, description } = req.body;

      if (!geomarker) {
        return res.status(400).json({ error: "Geomarker is required" });
      }

      // Parse geomarker if it's a string
      let parsedGeomarker: GeoMarker;
      try {
        parsedGeomarker =
          typeof geomarker === "string" ? JSON.parse(geomarker) : geomarker;
      } catch (error) {
        return res.status(400).json({ error: "Invalid geomarker format" });
      }

      // Validate geomarker
      if (!parsedGeomarker.lat || !parsedGeomarker.lng) {
        return res
          .status(400)
          .json({ error: "Geomarker must include lat and lng" });
      }

      const bucket = process.env.S3_BUCKET;
      if (!bucket) {
        throw new Error("S3_BUCKET environment variable not set");
      }

      const key = uuidv4();
      const stream = Readable.from(req.file.buffer);
      await uploadStream(bucket, key, stream, req.file.mimetype);
      const photoUrl = getPublicUrl(bucket, key);

      const item = req.repository.createItem({
        photo: photoUrl, // Save URL instead of buffer
        geomarker: parsedGeomarker,
        title,
        description,
        userId: req.user.did,
      });

      res.status(201).json(item);
    } catch (error) {
      console.error("Create item error:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  },
);

// Get all items
router.get("/", optionalAuth, (req: any, res: any) => {
  try {
    const items = req.repository.getAllItems();
    res.json(items);
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ error: "Failed to get items" });
  }
});

// Get items by location
router.get("/location", optionalAuth, (req: any, res: any) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const center: GeoMarker = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string),
    };

    const radiusKm = radius ? parseFloat(radius as string) : 10;

    const items = req.repository.getItemsByLocation(center, radiusKm);
    res.json(items);
  } catch (error) {
    console.error("Get items by location error:", error);
    res.status(500).json({ error: "Failed to get items by location" });
  }
});

// Get a specific item
router.get("/:id", optionalAuth, (req: any, res: any) => {
  try {
    const { id } = req.params;
    const item = req.repository.getItem(id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Get item error:", error);
    res.status(500).json({ error: "Failed to get item" });
  }
});

// Delete an item
router.delete("/:id", authenticateToken, (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;
    const item = req.repository.getItem(id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // For demo purposes, allow any authenticated user to delete
    // In production, you'd want to check ownership or permissions

    const deleted = req.repository.deleteItem(id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export { router as itemRoutes };
