import mongoose from "mongoose";
import { Lead } from "../models/Lead.js";
import { User } from "../models/User.js";
import { appendOnlyModel } from "../models/AppendOnly.js";
import { Setting } from "../models/Setting.js";

// Storage layer: MongoDB collections, or an in-memory fallback for local development.
// Each collection exposes the same small API keyed by its id field.

const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

// Minimal query matcher for the memory store: equality, $in, $ne, $exists, $regex (on strings).
function matches(row, query = {}) {
  return Object.entries(query).every(([k, cond]) => {
    const v = row[k];
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      if ("$in" in cond) return cond.$in.includes(v);
      if ("$ne" in cond) return v !== cond.$ne;
      if ("$exists" in cond) return cond.$exists ? v !== undefined && v !== null : v === undefined || v === null;
      if ("$regex" in cond) return new RegExp(cond.$regex, cond.$options || "").test(String(v ?? ""));
    }
    return v === cond;
  });
}

function memoryCollection(key) {
  const rows = new Map();
  const strip = (r, omit = []) => {
    if (!r) return null;
    const c = clone(r);
    omit.forEach((f) => delete c[f]);
    return c;
  };
  return {
    async create(doc) {
      if (rows.has(doc[key])) throw Object.assign(new Error("duplicate"), { code: 11000 });
      const now = new Date().toISOString();
      const row = { createdAt: now, updatedAt: now, ...clone(doc) };
      rows.set(row[key], row);
      return strip(row);
    },
    async get(id) {
      return strip(rows.get(id));
    },
    async findOne(query) {
      for (const r of rows.values()) if (matches(r, query)) return strip(r);
      return null;
    },
    async update(id, patch) {
      const r = rows.get(id);
      if (!r) return null;
      Object.assign(r, clone(patch), { updatedAt: new Date().toISOString() });
      return strip(r);
    },
    async updateMany(query, patch) {
      let n = 0;
      for (const r of rows.values()) if (matches(r, query)) { Object.assign(r, clone(patch), { updatedAt: new Date().toISOString() }); n++; }
      return n;
    },
    async pushEvents(id, events) {
      const r = rows.get(id);
      if (r) r.events = [...(r.events || []), ...clone(events)].slice(-300);
    },
    async list(query = {}, { limit = 1000, omit = [] } = {}) {
      const all = [...rows.values()].filter((r) => matches(r, query));
      all.sort((a, z) => String(z.createdAt).localeCompare(String(a.createdAt)));
      return all.slice(0, limit).map((r) => strip(r, omit));
    },
    async insertMany(docs) {
      for (const d of docs) await this.create(d);
    },
    async count(query = {}) {
      return [...rows.values()].filter((r) => matches(r, query)).length;
    },
    async remove(id) {
      return rows.delete(id);
    },
    async removeMany(query) {
      for (const [id, r] of rows) if (matches(r, query)) rows.delete(id);
    },
  };
}

function mongoCollection(Model, key) {
  const strip = (d) => {
    if (!d) return null;
    const { _id, __v, ...rest } = d;
    return JSON.parse(JSON.stringify(rest));
  };
  return {
    async create(doc) {
      return strip((await Model.create(doc)).toObject());
    },
    async get(id) {
      return strip(await Model.findOne({ [key]: id }).lean());
    },
    async findOne(query) {
      return strip(await Model.findOne(query).lean());
    },
    async update(id, patch) {
      return strip(await Model.findOneAndUpdate({ [key]: id }, { $set: patch }, { new: true }).lean());
    },
    async updateMany(query, patch) {
      return (await Model.updateMany(query, { $set: patch })).modifiedCount;
    },
    async pushEvents(id, events) {
      await Model.updateOne({ [key]: id }, { $push: { events: { $each: events, $slice: -300 } } });
    },
    async list(query = {}, { limit = 1000, omit = [] } = {}) {
      const q = Model.find(query).sort({ createdAt: -1 }).limit(limit);
      if (omit.length) q.select(omit.map((f) => "-" + f).join(" "));
      return (await q.lean()).map(strip);
    },
    async insertMany(docs) {
      await Model.insertMany(docs);
    },
    async count(query = {}) {
      return Model.countDocuments(query);
    },
    async remove(id) {
      await Model.deleteOne({ [key]: id });
    },
    async removeMany(query) {
      await Model.deleteMany(query);
    },
  };
}

// Append-only stores: consent records, gate artifacts, decision log, TCPA suppressions
// and the staff access log. Only append / read is exported — there is no update or
// delete path to reach them. In production also enforce it with a MongoDB role that
// lacks update/remove on these collections.
export const APPEND_ONLY = ["consents", "artifacts", "decisions", "suppressions", "accessLog"];
const appendOnly = (col) => ({
  append: (doc) => col.create(doc),
  findOne: (q) => col.findOne(q),
  list: (q, o) => col.list(q, o),
  count: (q) => col.count(q),
  insertMany: (docs) => col.insertMany(docs),
});
const memoryAppendOnly = () => Object.fromEntries(APPEND_ONLY.map((n) => [n, appendOnly(memoryCollection("recId"))]));

export const db = { kind: "memory", leads: memoryCollection("leadId"), users: memoryCollection("userId"), settings: memoryCollection("key"), ...memoryAppendOnly() };

export async function connectDB(uri) {
  if (!uri) {
    console.log("[db] MONGO_URI not set → in-memory store (development only; data resets on restart)");
    return db;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    Object.assign(db, {
      kind: "mongodb",
      leads: mongoCollection(Lead, "leadId"),
      users: mongoCollection(User, "userId"),
      settings: mongoCollection(Setting, "key"),
      ...Object.fromEntries(APPEND_ONLY.map((n) => [n, appendOnly(mongoCollection(appendOnlyModel(n), "recId"))])),
    });
    console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
  } catch (e) {
    if (process.env.NODE_ENV === "production") throw e;
    console.warn(`[db] could not reach MongoDB (${e.message}) → falling back to in-memory store`);
  }
  return db;
}

export async function disconnectDB() {
  if (db.kind === "mongodb") await mongoose.disconnect();
}
