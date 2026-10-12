import { config } from "dotenv";
import { createDatabase } from "../src/server/db";
import { seedDatabase } from "./seed-data";
config({ path: ".env.local", quiet: true });
const db = createDatabase(process.env.DATABASE_PATH || "./data/community.db");
try {
  console.log(
    (await seedDatabase(db)) ? "Seeded 15 events." : "Events already exist; nothing changed.",
  );
} finally {
  db.close();
}
