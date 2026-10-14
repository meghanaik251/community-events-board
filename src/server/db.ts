import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function createDatabase(path: string) {
  if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
  const version = Number(db.prepare("PRAGMA user_version").get()?.user_version);
  if (version < 1) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')), preferences_set INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
      CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
      CREATE INDEX sessions_expiry ON sessions(expires_at);
      CREATE TABLE events (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('Music','Workshop','Food','Sports','Kids')), city TEXT NOT NULL COLLATE NOCASE, starts_at INTEGER NOT NULL, price_paise INTEGER NOT NULL CHECK(price_paise >= 0), description TEXT NOT NULL, image_url TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), created_at INTEGER NOT NULL);
      CREATE INDEX events_active_date ON events(active, starts_at, id);
      CREATE INDEX events_category_city_date ON events(active, category, city, starts_at, id);
      CREATE TABLE favourite_categories (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, category TEXT NOT NULL CHECK(category IN ('Music','Workshop','Food','Sports','Kids')), PRIMARY KEY(user_id, category));
      CREATE TABLE reminders (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, PRIMARY KEY(user_id, event_id));
      CREATE TABLE card_designs (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, theme TEXT NOT NULL CHECK(theme IN ('sage','lilac','sunset')), stickers TEXT NOT NULL, PRIMARY KEY(user_id, event_id));
      CREATE TABLE rate_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, resets_at INTEGER NOT NULL);
      PRAGMA user_version = 1;
      COMMIT;`);
  }
  return db;
}

const globalDb = globalThis as typeof globalThis & { communityDb?: DatabaseSync };
export function getDb() {
  return (globalDb.communityDb ??= createDatabase(
    process.env.DATABASE_PATH || "./data/community.db",
  ));
}
