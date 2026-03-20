import type { Document, Model, Types } from 'mongoose'
import { Schema, model } from 'mongoose'

import type { UrlId } from './Url'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface ClickAttrs {
  urlId: UrlId
  timestamp: Date
  ip: string
  userAgent: string
  country?: string
  city?: string
  device: DeviceType
  browser: string
  referrer?: string
}

export type ClickDocument = Document<unknown, unknown, ClickAttrs> &
  ClickAttrs & {
    _id: Types.ObjectId
  }

export type ClickModel = Model<ClickDocument>

const ClickSchema = new Schema<ClickDocument, ClickModel>(
  {
    urlId: {
      type: Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      required: true,
      trim: true,
    },
    userAgent: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    device: {
      type: String,
      required: true,
      enum: ['mobile', 'tablet', 'desktop'],
    },
    browser: {
      type: String,
      required: true,
      trim: true,
    },
    referrer: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: false },
)

// Fast analytics queries by URL and time.
ClickSchema.index({ urlId: 1, timestamp: -1 })

export const Click = model<ClickDocument, ClickModel>('Click', ClickSchema)

