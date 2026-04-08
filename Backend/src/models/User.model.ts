import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
    },
    // Google OAuth user ID (replaces auth0Id)
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Authentication provider: 'local' for email/password, 'google' for Google OAuth
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model('User', userSchema);
