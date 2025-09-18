import { LexiconDoc } from "@atproto/lexicon";
import { TID } from "@atproto/common-web";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { Item, User, GeoMarker, UserProfile } from "../types";

// Load lexicons
const itemLexicon: LexiconDoc = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../lexicons/item.json"), "utf8"),
);

const profileLexicon: LexiconDoc = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../lexicons/profile.json"), "utf8"),
);

export class Repository {
  private items: Map<string, Item> = new Map();
  private users: Map<string, User> = new Map();
  private sessions: Map<string, any> = new Map();
  private lexicons: Map<string, LexiconDoc> = new Map();

  constructor() {
    // Initialize lexicons
    this.lexicons.set("app.gleam.item", itemLexicon);
    this.lexicons.set("app.gleam.actor.profile", profileLexicon);
  }

  // Lexicon methods
  getLexicon(id: string): LexiconDoc | undefined {
    return this.lexicons.get(id);
  }

  // Item methods
  createItem(data: {
    photo: string | Buffer;
    geomarker: GeoMarker;
    title?: string;
    description?: string;
    userId: string;
  }): Item {
    const id = uuidv4();
    const tid = TID.nextStr();

    const item: Item = {
      id,
      photo:
        typeof data.photo === "string"
          ? data.photo
          : data.photo.toString("base64"),
      geomarker: data.geomarker,
      title: data.title,
      description: data.description,
      createdAt: new Date().toISOString(),
    };

    this.items.set(id, item);
    return item;
  }

  getItem(id: string): Item | undefined {
    return this.items.get(id);
  }

  getAllItems(): Item[] {
    return Array.from(this.items.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getItemsByLocation(center: GeoMarker, radiusKm: number = 10): Item[] {
    return this.getAllItems().filter((item) => {
      const distance = this.calculateDistance(center, item.geomarker);
      return distance <= radiusKm;
    });
  }

  deleteItem(id: string): boolean {
    return this.items.delete(id);
  }

  // User methods
  createUser(data: {
    handle: string;
    password: string;
    email?: string;
    profile?: Partial<UserProfile>;
  }): User {
    const did = `did:plc:${uuidv4().replace(/-/g, "")}`;

    const user: User = {
      did,
      handle: data.handle,
      profile: data.profile,
      createdAt: new Date().toISOString(),
    };

    this.users.set(did, user);
    return user;
  }

  getUser(did: string): User | undefined {
    return this.users.get(did);
  }

  getUserByHandle(handle: string): User | undefined {
    return Array.from(this.users.values()).find(
      (user) => user.handle === handle,
    );
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUserProfile(
    did: string,
    profile: Partial<UserProfile>,
  ): User | undefined {
    const user = this.users.get(did);
    if (!user) return undefined;

    user.profile = { ...user.profile, ...profile };
    this.users.set(did, user);
    return user;
  }

  deleteUser(did: string): boolean {
    return this.users.delete(did);
  }

  // Session methods
  createSession(did: string): { accessJwt: string; refreshJwt: string } {
    const sessionId = uuidv4();
    const accessJwt = `access_${sessionId}`;
    const refreshJwt = `refresh_${sessionId}`;

    this.sessions.set(accessJwt, {
      did,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });

    return { accessJwt, refreshJwt };
  }

  validateSession(accessJwt: string): string | null {
    const session = this.sessions.get(accessJwt);
    if (!session) return null;

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      this.sessions.delete(accessJwt);
      return null;
    }

    return session.did;
  }

  deleteSession(accessJwt: string): boolean {
    return this.sessions.delete(accessJwt);
  }

  // Utility methods
  private calculateDistance(pos1: GeoMarker, pos2: GeoMarker): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(pos2.lat - pos1.lat);
    const dLon = this.toRadians(pos2.lng - pos1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(pos1.lat)) *
        Math.cos(this.toRadians(pos2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
