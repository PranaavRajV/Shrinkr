import { Schema, model, Types, Document } from 'mongoose'

export interface ApiKeyAttrs {
  userId: Types.ObjectId
  name: string
  key: string       // Hashed sk_live_...
  keyPrefix: string // First 12 chars of raw key + ...
  lastUsed: Date | null
  usageCount: number
  isActive: boolean
  permissions: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  rateLimit: number // requests per hour
  expiresAt: Date | null
  createdAt: Date
}

export interface ApiKeyDocument extends Document, ApiKeyAttrs {
  _id: Types.ObjectId
}

const ApiKeySchema = new Schema<ApiKeyDocument>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    key: { 
      type: String, 
      unique: true, 
      required: true 
    },
    keyPrefix: { 
      type: String,
      required: true
    },
    lastUsed: { 
      type: Date, 
      default: null 
    },
    usageCount: { 
      type: Number, 
      default: 0 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    permissions: {
      create: { type: Boolean, default: true },
      read: { type: Boolean, default: true },
      update: { type: Boolean, default: true },
      delete: { type: Boolean, default: false }
    },
    rateLimit: { 
      type: Number, 
      default: 100 
    },
    expiresAt: { 
      type: Date, 
      default: null 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: false }
)

export const ApiKey = model<ApiKeyDocument>('ApiKey', ApiKeySchema)
