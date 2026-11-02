import mongoose from "mongoose";

// Mutable operational settings an admin can change at runtime (unlike the append-only
// compliance stores, which exist precisely so they cannot be edited).
// Today this holds the provider/state panel overrides; one document per key.
const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: String,
  },
  { timestamps: true, versionKey: false }
);

export const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
