/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon'
import { type $Typed, is$typed, maybe$typed } from './util.js'

export const schemaDict = {
  AppGleamItem: {
    lexicon: 1,
    id: 'app.gleam.item',
    defs: {
      main: {
        type: 'record',
        description: 'An item with photo and location information',
        key: 'tid',
        record: {
          type: 'object',
          required: ['id', 'photo', 'geomarker', 'createdAt'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the item',
            },
            photo: {
              type: 'blob',
              accept: ['image/png', 'image/jpeg', 'image/webp'],
              maxSize: 10000000,
              description: 'Photo of the item',
            },
            geomarker: {
              type: 'ref',
              ref: 'lex:app.gleam.item#geomarker',
              description: 'Geographic location of the item',
            },
            title: {
              type: 'string',
              maxLength: 300,
              description: 'Optional title for the item',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Optional description of the item',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Time when the item was created',
            },
          },
        },
      },
      geomarker: {
        type: 'object',
        description: 'Geographic coordinates',
        required: ['lat', 'lng'],
        properties: {
          lat: {
            type: 'string',
            description: 'Latitude coordinate',
          },
          lng: {
            type: 'string',
            description: 'Longitude coordinate',
          },
        },
      },
    },
  },
  AppGleamActorProfile: {
    lexicon: 1,
    id: 'app.gleam.actor.profile',
    defs: {
      main: {
        type: 'record',
        description: 'User profile information',
        key: 'literal:self',
        record: {
          type: 'object',
          properties: {
            displayName: {
              type: 'string',
              maxLength: 64,
              description: "User's display name",
            },
            avatar: {
              type: 'blob',
              accept: ['image/png', 'image/jpeg', 'image/webp'],
              maxSize: 1000000,
              description: "User's avatar image",
            },
            points: {
              type: 'integer',
              description: "User's current point count",
            },
          },
        },
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      }
}

export const ids = {
  AppGleamItem: 'app.gleam.item',
  AppGleamActorProfile: 'app.gleam.actor.profile',
} as const
