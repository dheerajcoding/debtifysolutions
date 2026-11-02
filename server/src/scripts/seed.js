// Resets the sample applications in MongoDB: npm run seed
import { env } from "../config/env.js";
import { connectDB, db, disconnectDB } from "../config/db.js";
import { buildSamples } from "../services/samples.js";

await connectDB(env.mongoUri);
if (db.kind !== "mongodb") {
  console.log("MongoDB is not configured; samples are seeded automatically in memory when the server starts.");
  process.exit(0);
}
await db.leads.removeMany({ source: "sample" });
await db.leads.insertMany(buildSamples());
console.log(`Seeded ${await db.leads.count({ source: "sample" })} sample applications.`);
await disconnectDB();
