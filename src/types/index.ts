import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export interface UserTable {
  did: string;
  handle: string;
  points: number;
  createdAt: ColumnType<string | undefined, never>;
  updatedAt: ColumnType<string | undefined, never>;
}

export type ItemTable = {
  uri: Generated<string>;
  authorDid: string;
  title: string;
  description: string;
  photo: string;
  "geomarker.lng": string;
  "geomarker.lat": string;
  createdAt: ColumnType<string | undefined, never>;
  updatedAt: ColumnType<string | undefined, never>;
};

export type User = Selectable<UserTable>;
export type Item = Selectable<ItemTable>;

export type NewUser = Insertable<UserTable>;
export type NewItem = Insertable<ItemTable>;

export type UpdateUser = Updateable<UserTable>;
export type UpdateItem = Updateable<ItemTable>;
