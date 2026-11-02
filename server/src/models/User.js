import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, index: true },
    email: { type: String, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: String,
    first: String,
    last: String,
    phone: String,
    lang: { type: String, default: "en" },
    role: { type: String, enum: ["user", "staff", "admin"], default: "user", index: true },
    emailVerified: { type: Boolean, default: false },
    verifyTokenHash: { type: String, index: true },
    verifyExpires: Date,
    resetTokenHash: { type: String, index: true },
    resetExpires: Date,
    tokenVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lockUntil: Date,
    lastLoginAt: Date,
  },
  { timestamps: true, minimize: false }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
