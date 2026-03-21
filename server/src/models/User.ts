import bcrypt from 'bcryptjs'
import type { Document, Model, Types } from 'mongoose'
import { Schema, model } from 'mongoose'

export type UserId = Types.ObjectId

export interface UserAttrs {
  email: string
  passwordHash?: string
  googleId?: string
  name?: string
  avatar?: string   // base64 data URL or external URL
  bio?: string
  
  // Feature 1: Link in Bio
  username?: string
  bioName?: string
  bioDescription?: string
  bioAvatar?: string
  bioTheme?: 'dark' | 'light' | 'accent'
  bioLinks?: {
    urlId: Types.ObjectId
    order: number
    showClickCount: boolean
    customTitle?: string
  }[]

  // Feature 5: 2FA
  twoFactorSecret?: string
  twoFactorEnabled?: boolean
  twoFactorBackupCodes?: string[]
}

export interface UserMethods {
  comparePassword(plain: string): Promise<boolean>
}

export type UserDocument = Document<unknown, unknown, UserAttrs> &
  UserAttrs &
  UserMethods & {
    _id: UserId
    createdAt: Date
    updatedAt: Date
  }

export type UserModel = Model<UserDocument>

const UserSchema = new Schema<UserDocument, UserModel, UserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    // Bio Page Fields
    username: { 
      type: String, 
      unique: true, 
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9_]{3,20}$/, 'Invalid username format']
    },
    bioName: { type: String, default: '' },
    bioDescription: { type: String, default: '', maxlength: 160 },
    bioAvatar: { type: String, default: '' },
    bioTheme: { 
      type: String, 
      default: 'dark',
      enum: ['dark', 'light', 'accent']
    },
    bioLinks: [{
      urlId: { type: Schema.Types.ObjectId, ref: 'Url' },
      order: { type: Number, default: 0 },
      showClickCount: { type: Boolean, default: true },
      customTitle: { type: String, default: '' }
    }],
    // 2FA Fields
    twoFactorSecret: { type: String, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorBackupCodes: [{ type: String }]
  },
  { timestamps: true },
)

// Hash plaintext passwords before saving.
UserSchema.pre('save', async function (this: UserDocument) {
  if (!this.passwordHash || !this.isModified('passwordHash')) return
  const rounds = process.env.BCRYPT_SALT_ROUNDS
    ? Number(process.env.BCRYPT_SALT_ROUNDS)
    : 12
  this.passwordHash = await bcrypt.hash(this.passwordHash, rounds)
})

UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  plain: string,
): Promise<boolean> {
  if (!this.passwordHash) return false
  return bcrypt.compare(plain, this.passwordHash)
}

export const User = model<UserDocument, UserModel>('User', UserSchema)
