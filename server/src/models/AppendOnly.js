import mongoose from "mongoose";

// Schemas for the append-only collections. Flexible documents keyed by recId;
// indexes on the fields the admin console filters by.
const cache = {};
const INDEXES = {
  consents: [{ leadId: 1 }, { key: 1 }],
  artifacts: [{ leadId: 1, gate: 1 }],
  decisions: [{ leadId: 1 }],
  suppressions: [{ phoneE164: 1 }],
  accessLog: [{ at: -1 }, { leadId: 1 }],
};

export function appendOnlyModel(name) {
  if (cache[name]) return cache[name];
  const schema = new mongoose.Schema({ recId: { type: String, unique: true, index: true } }, { strict: false, timestamps: { createdAt: true, updatedAt: false } });
  (INDEXES[name] || []).forEach((i) => schema.index(i));
  // Refuse updates and deletes at the model layer too.
  for (const op of ["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete", "replaceOne"]) {
    schema.pre(op, function (next) { next(new Error(`${name} is append-only`)); });
  }
  const modelName = "AO_" + name;
  cache[name] = mongoose.models[modelName] || mongoose.model(modelName, schema, name);
  return cache[name];
}
