import bcrypt from 'bcryptjs'
import type { Document, Model, Types } from 'mongoose'
import { Schema, model } from 'mongoose'

export type UserId = Types.ObjectId

export interface UserAttrs {
  email: string
  passwordHash: string
  name?: string
  avatar?: string   // base64 data URL or external URL
  bio?: string
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
      required: true,
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
  },
  { timestamps: true },
)

// Hash plaintext passwords before saving.
UserSchema.pre('save', async function (this: UserDocument) {
  if (!this.isModified('passwordHash')) return
  const rounds = process.env.BCRYPT_SALT_ROUNDS
    ? Number(process.env.BCRYPT_SALT_ROUNDS)
    : 12
  this.passwordHash = await bcrypt.hash(this.passwordHash, rounds)
})

UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  plain: string,
): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash)
}

export const User = model<UserDocument, UserModel>('User', UserSchema)
