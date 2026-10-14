import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { config, parse } from "dotenv";
import { getSecret } from "../src/server/auth";
import { createDatabase } from "../src/server/db";
import { seedDatabase } from "./seed-data";

if (!existsSync(".env.local")) {
  writeFileSync(
    ".env.local",
    `JWT_SECRET=${randomBytes(48).toString("hex")}\nDATABASE_PATH=./data/community.db\nADMIN_EMAIL=admin@community.local\nADMIN_PASSWORD=CommunityAdmin123!\nLOG_LEVEL=info\nCOOKIE_SECURE=false\n`,
    { mode: 0o600 },
  );
}
// A copied example must be runnable without asking the user to invent a secret.
// Preserve custom settings and never rotate an existing usable secret on reruns.
const environment = readFileSync(".env.local", "utf8");
const configuredSecret = parse(environment).JWT_SECRET;
if (!configuredSecret || configuredSecret.startsWith("replace-with")) {
  const preserved = environment.replace(/^\s*(?:export\s+)?JWT_SECRET\s*=.*$/gm, "");
  writeFileSync(
    ".env.local",
    `${preserved.trimEnd()}\nJWT_SECRET=${randomBytes(48).toString("hex")}\n`,
    {
      mode: 0o600,
    },
  );
}
config({ path: ".env.local", quiet: true });
getSecret();
const db = createDatabase(process.env.DATABASE_PATH || "./data/community.db");
try {
  const seeded = await seedDatabase(db);
  console.log(
    seeded
      ? "Ready: database created with 15 sample events and an admin account."
      : "Ready: existing database and events preserved.",
  );
  console.log(
    "Run npm run dev, then open http://127.0.0.1:3000. Admin credentials are in .env.local.",
  );
} finally {
  db.close();
}
