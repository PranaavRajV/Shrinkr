import type { Document, Model, Types } from 'mongoose'
import { Schema, model } from 'mongoose'

import type { UserId } from './User'

export type UrlId = Types.ObjectId

export interface UrlAttrs {
  shortCode: string
  originalUrl: string
  userId: UserId

  title?: string
  customAlias?: string
  expiresAt?: Date
  isActive?: boolean
  totalClicks?: number
  realClicks?: number
  linkPassword?: string | null
  tags?: string[]
  targeting?: {
    mobile?: string | null
    tablet?: string | null
    countries?: Array<{ code: string, url: string }>
  }
  ogData?: {
    title: string
    description: string
    image: string
    favicon: string
    siteName: string
  }
  isPinned?: boolean
  note?: string
  webhookUrl?: string | null
  webhookSecret?: string | null
  clickGoal?: number | null
  goalReachedAt?: Date | null
  goalNotified?: boolean
  lastClickAt?: Date | null
}

export type UrlDocument = Document<unknown, unknown, UrlAttrs> &
  Omit<
    UrlAttrs,
    'isActive' | 'totalClicks'
  > & {
    _id: UrlId
    createdAt: Date
    updatedAt: Date
    isActive: boolean
    totalClicks: number
    realClicks: number
    linkPassword?: string | null
    tags: string[]
    targeting?: {
      mobile?: string | null
      tablet?: string | null
      countries?: Array<{ code: string, url: string }>
    }
    ogData: {
      title: string
      description: string
      image: string
      favicon: string
      siteName: string
    }
    isPinned: boolean
    note: string
    webhookUrl: string | null
    webhookSecret: string | null
    clickGoal?: number | null
    goalReachedAt?: Date | null
    goalNotified: boolean
    lastClickAt?: Date | null
  }

export type UrlModel = Model<UrlDocument>

const UrlSchema = new Schema<UrlDocument, UrlModel>(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: false,
      trim: true,
    },
    customAlias: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
    totalClicks: {
      type: Number,
      required: false,
      default: 0,
    },
    realClicks: {
      type: Number,
      required: false,
      default: 0,
    },
    linkPassword: {
      type: String,
      required: false,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    targeting: {
      mobile: { type: String, default: null },
      tablet: { type: String, default: null },
      countries: [{
        code: { type: String, uppercase: true },
        url: { type: String }
      }]
    },
    ogData: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      image: { type: String, default: '' },
      favicon: { type: String, default: '' },
      siteName: { type: String, default: '' }
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    note: {
      type: String,
      default: '',
      maxLength: 500
    },
    webhookUrl: {
      type: String,
      default: null,
      trim: true,
    },
    webhookSecret: {
      type: String,
      default: null,
      trim: true,
    },
    clickGoal: {
      type: Number,
      default: null
    },
    goalReachedAt: {
      type: Date,
      default: null
    },
    goalNotified: {
      type: Boolean,
      default: false
    },
    lastClickAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true },
)


export const Url = model<UrlDocument, UrlModel>('Url', UrlSchema)

export type { UrlAttrs as UrlInput }
