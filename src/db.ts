import SqliteDb from "better-sqlite3";
import {
  Kysely,
  Migrator,
  SqliteDialect,
  Migration,
  MigrationProvider,
} from "kysely";
import { Item, User } from "./types";

// Types

export type DatabaseSchema = {
  user: User;
  item: Item;
};

// Migrations

const migrations: Record<string, Migration> = {};

const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};

migrations["001"] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable("user")
      .addColumn("did", "varchar", (col) => col.primaryKey())
      .addColumn("handle", "varchar", (col) => col.notNull())
      .addColumn("points", "bigint", (col) => col.notNull())
      .addColumn("createdAt", "varchar", (col) => col.notNull())
      .addColumn("updatedAt", "varchar", (col) => col.notNull())
      .execute();
    await db.schema
      .createTable("item")
      .addColumn("uri", "varchar", (col) => col.primaryKey())
      .addColumn("authorDid", "varchar", (col) => col.notNull())
      .addColumn("title", "varchar", (col) => col.notNull())
      .addColumn("description", "varchar", (col) => col.notNull())
      .addColumn("photo", "varchar", (col) => col.notNull())
      .addColumn("geomarker.lng", "varchar", (col) => col.notNull())
      .addColumn("geomarker.lat", "varchar", (col) => col.notNull())
      .addColumn("createdAt", "varchar", (col) => col.notNull())
      .addColumn("updatedAt", "varchar", (col) => col.notNull())
      .execute();
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable("user").execute();
    await db.schema.dropTable("item").execute();
  },
};

// APIs

export const createDb = (location: string): Database => {
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  });
};

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
};

export type Database = Kysely<DatabaseSchema>;
