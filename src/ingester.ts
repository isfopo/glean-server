import pino from "pino";
import { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import type { Database } from "./db";
import * as Item from "./lexicon/types/app/glean/item";

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = pino({ name: "firehose ingestion" });
  return new Firehose({
    idResolver,
    handleEvent: async (evt) => {
      // Watch for write events
      if (evt.event === "create" || evt.event === "update") {
        const now = new Date();
        const record: Item.Record = evt.record;

        // If the write is a valid status update
        if (
          evt.collection === "app.glean.item" &&
          Item.isRecord(record) &&
          Item.validateRecord(record).success
        ) {
          // Store the item in our SQLite
          await db
            .insertInto("item")
            .values({
              uri: evt.uri.toString(),
              authorDid: evt.did,
              title: record.title,
              description: record.description,
              photo: record.photo,
              ["geomarker.lng"]: record.geomarker.lng,
              ["geomarker.lat"]: record.geomarker.lat,
              indexedAt: now.toISOString(),
            })
            .onConflict((oc) =>
              oc.column("uri").doUpdateSet({
                title: record.title,
                description: record.description,
                photo: record.photo,
                ["geomarker.lng"]: record.geomarker.lng,
                ["geomarker.lat"]: record.geomarker.lat,
                indexedAt: now.toISOString(),
              }),
            )
            .execute();
        }
      } else if (
        evt.event === "delete" &&
        evt.collection === "app.glean.item"
      ) {
        // Remove the status from our SQLite
        await db
          .deleteFrom("item")
          .where("uri", "=", evt.uri.toString())
          .execute();
      }
    },
    onError: (err) => {
      logger.error({ err }, "error on firehose ingestion");
    },
    filterCollections: ["app.glean.item"],
    excludeIdentity: true,
    excludeAccount: true,
  });
}
