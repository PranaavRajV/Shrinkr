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
  referrerSource?: string
  referrerMedium?: string
  isBot?: boolean
  botReason?: string
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
    referrerSource: {
      type: String,
      default: 'direct',
      trim: true,
      index: true
    },
    referrerMedium: {
      type: String,
      default: 'direct',
      trim: true,
      index: true
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
    botReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: false },
)

// Optimized indices for heatmap and referrer analysis
ClickSchema.index({ urlId: 1, timestamp: -1 })
ClickSchema.index({ urlId: 1, referrerSource: 1 })
ClickSchema.index({ urlId: 1, referrerMedium: 1 })

export const Click = model<ClickDocument, ClickModel>('Click', ClickSchema)

