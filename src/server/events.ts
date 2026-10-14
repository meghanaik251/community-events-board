import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { randomUUID } from "node:crypto";
import type {
  CardDesign,
  Category,
  CommunityEvent,
  EventFilters,
  EventInput,
  EventResults,
} from "@/lib/types";
import { AppError } from "./errors";

type EventRow = {
  id: string;
  title: string;
  category: Category;
  city: string;
  starts_at: number;
  price_paise: number;
  description: string;
  image_url: string;
  active: number;
  reminded?: number;
};
const mapEvent = (row: EventRow): CommunityEvent => ({
  id: row.id,
  title: row.title,
  category: row.category,
  city: row.city,
  startsAt: new Date(row.starts_at).toISOString(),
  pricePaise: row.price_paise,
  description: row.description,
  imageUrl: row.image_url,
  active: Boolean(row.active),
  reminded: Boolean(row.reminded),
});

export function createEvent(db: DatabaseSync, input: EventInput) {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO events (id,title,category,city,starts_at,price_paise,description,image_url,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(
    id,
    input.title,
    input.category,
    input.city,
    Date.parse(input.startsAt),
    input.pricePaise,
    input.description,
    input.imageUrl,
    Date.now(),
  );
  return mapEvent(db.prepare("SELECT * FROM events WHERE id = ?").get(id) as EventRow);
}
export function setEventActive(db: DatabaseSync, id: string, active: boolean) {
  const result = db.prepare("UPDATE events SET active = ? WHERE id = ?").run(Number(active), id);
  if (!result.changes) throw new AppError(404, "NOT_FOUND", "Event not found");
  return { active };
}
export function listEvents(
  db: DatabaseSync,
  filters: EventFilters,
  userId?: string,
  now = Date.now(),
): EventResults {
  const where: string[] = [];
  const params: SQLInputValue[] = [];
  if (!filters.admin) {
    where.push("e.active = 1", "e.starts_at > ?");
    params.push(now);
  }
  if (filters.category) {
    where.push("e.category = ?");
    params.push(filters.category);
  }
  if (filters.city) {
    where.push("e.city = ? COLLATE NOCASE");
    params.push(filters.city);
  }
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    where.push("(e.title LIKE ? ESCAPE '\\' OR e.description LIKE ? ESCAPE '\\')");
    params.push(pattern, pattern);
  }
  if (filters.feed) {
    where.push("e.category IN (SELECT category FROM favourite_categories WHERE user_id = ?)");
    params.push(userId ?? "");
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = Number(
    db.prepare(`SELECT COUNT(*) AS total FROM events e ${clause}`).get(...params)?.total ?? 0,
  );
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 6;
  const rows = db
    .prepare(
      `SELECT e.*, EXISTS(SELECT 1 FROM reminders r WHERE r.event_id=e.id AND r.user_id=?) AS reminded FROM events e ${clause} ORDER BY e.starts_at ASC, e.id ASC LIMIT ? OFFSET ?`,
    )
    .all(userId ?? "", ...params, pageSize, (page - 1) * pageSize) as EventRow[];
  return {
    events: rows.map(mapEvent),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
export function getEvent(db: DatabaseSync, id: string, userId?: string, now = Date.now()) {
  const row = db
    .prepare(
      "SELECT e.*, EXISTS(SELECT 1 FROM reminders r WHERE r.event_id=e.id AND r.user_id=?) AS reminded FROM events e WHERE e.id=? AND e.active=1 AND e.starts_at > ?",
    )
    .get(userId ?? "", id, now) as EventRow | undefined;
  if (!row) throw new AppError(404, "NOT_FOUND", "This event is no longer available");
  return mapEvent(row);
}
export function getCities(db: DatabaseSync) {
  return (
    db
      .prepare(
        "SELECT DISTINCT city FROM events WHERE active=1 AND starts_at > ? ORDER BY city COLLATE NOCASE",
      )
      .all(Date.now()) as { city: string }[]
  ).map((row) => row.city);
}
export function getFavourites(db: DatabaseSync, userId: string): Category[] {
  return (
    db
      .prepare("SELECT category FROM favourite_categories WHERE user_id = ? ORDER BY category")
      .all(userId) as { category: Category }[]
  ).map((row) => row.category);
}
export function setFavourites(db: DatabaseSync, userId: string, categories: Category[]) {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM favourite_categories WHERE user_id=?").run(userId);
    const insert = db.prepare("INSERT INTO favourite_categories (user_id,category) VALUES (?,?)");
    for (const category of new Set(categories)) insert.run(userId, category);
    db.prepare("UPDATE users SET preferences_set=1 WHERE id=?").run(userId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return getFavourites(db, userId);
}
export function setReminder(
  db: DatabaseSync,
  userId: string,
  eventId: string,
  reminded: boolean,
  now = Date.now(),
) {
  getEvent(db, eventId, userId, now);
  if (reminded)
    db.prepare("INSERT OR IGNORE INTO reminders (user_id,event_id) VALUES (?,?)").run(
      userId,
      eventId,
    );
  else db.prepare("DELETE FROM reminders WHERE user_id=? AND event_id=?").run(userId, eventId);
  return { reminded };
}
export function getDesign(
  db: DatabaseSync,
  userId: string,
  eventId: string,
  now = Date.now(),
): CardDesign {
  getEvent(db, eventId, userId, now);
  const row = db
    .prepare("SELECT theme,stickers FROM card_designs WHERE user_id=? AND event_id=?")
    .get(userId, eventId) as { theme: CardDesign["theme"]; stickers: string } | undefined;
  return row
    ? { theme: row.theme, stickers: JSON.parse(row.stickers) }
    : { theme: "sage", stickers: [] };
}
export function saveDesign(
  db: DatabaseSync,
  userId: string,
  eventId: string,
  design: CardDesign,
  now = Date.now(),
) {
  getEvent(db, eventId, userId, now);
  db.prepare(
    "INSERT INTO card_designs (user_id,event_id,theme,stickers) VALUES (?,?,?,?) ON CONFLICT(user_id,event_id) DO UPDATE SET theme=excluded.theme,stickers=excluded.stickers",
  ).run(userId, eventId, design.theme, JSON.stringify(design.stickers));
  return design;
}
