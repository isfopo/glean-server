/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../lexicons'
import { type $Typed, is$typed as _is$typed, type OmitKey } from '../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.glean.item'

export interface Record {
  $type: 'app.glean.item'
  /** Unique identifier for the item */
  id: string
  /** Photo of the item */
  photo: BlobRef
  geomarker: Geomarker
  /** Optional title for the item */
  title?: string
  /** Optional description of the item */
  description?: string
  /** Time when the item was created */
  createdAt: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}

/** Geographic coordinates */
export interface Geomarker {
  $type?: 'app.glean.item#geomarker'
  /** Latitude coordinate */
  lat: string
  /** Longitude coordinate */
  lng: string
}

const hashGeomarker = 'geomarker'

export function isGeomarker<V>(v: V) {
  return is$typed(v, id, hashGeomarker)
}

export function validateGeomarker<V>(v: V) {
  return validate<Geomarker & V>(v, id, hashGeomarker)
}
