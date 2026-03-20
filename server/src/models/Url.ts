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
  },
  { timestamps: true },
)


export const Url = model<UrlDocument, UrlModel>('Url', UrlSchema)

export type { UrlAttrs as UrlInput }

