import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "@/lib/types";
import { AppError } from "./errors";

export const SESSION_COOKIE = "community_session";
export const SESSION_SECONDS = 60 * 60 * 24;
type Credentials = { email: string; password: string };
type UserRow = {
  id: string;
  email: string;
  role: "user" | "admin";
  preferences_set: number;
  password_hash: string;
};
const publicUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  role: row.role,
  preferencesSet: Boolean(row.preferences_set),
});

export function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("replace-with"))
    throw new Error("Run npm run setup to configure JWT_SECRET");
  return secret;
}

async function issueSession(db: DatabaseSync, user: User, secret: string) {
  const id = randomUUID();
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  db.prepare("INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)").run(
    id,
    user.id,
    expiresAt,
  );
  const token = await new SignJWT({ sid: id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("community-events-board")
    .setAudience("community-api")
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(new TextEncoder().encode(secret));
  return { user, token, expiresIn: SESSION_SECONDS };
}

export async function signup(db: DatabaseSync, credentials: Credentials, secret: string) {
  const email = credentials.email.trim().toLowerCase();
  const hash = await bcrypt.hash(credentials.password, 12);
  const id = randomUUID();
  try {
    db.prepare("INSERT INTO users (id,email,password_hash,created_at) VALUES (?,?,?,?)").run(
      id,
      email,
      hash,
      Date.now(),
    );
  } catch (error) {
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
      throw new AppError(409, "EMAIL_EXISTS", "An account with this email already exists");
    throw error;
  }
  return issueSession(db, { id, email, role: "user", preferencesSet: false }, secret);
}

// A valid dummy hash keeps an unknown email on the same expensive comparison path.
const DUMMY_HASH = "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
export async function login(db: DatabaseSync, credentials: Credentials, secret: string) {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(credentials.email.trim().toLowerCase()) as UserRow | undefined;
  const valid = await bcrypt.compare(credentials.password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !valid) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  return issueSession(db, publicUser(row), secret);
}

async function verify(token: string, secret: string) {
  return (
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
      issuer: "community-events-board",
      audience: "community-api",
    })
  ).payload;
}
export async function authenticate(
  db: DatabaseSync,
  token: string | undefined,
  secret: string,
): Promise<User | null> {
  if (!token) return null;
  try {
    const payload = await verify(token, secret);
    if (typeof payload.sid !== "string" || !payload.sub) return null;
    const row = db
      .prepare(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.id = ? AND u.id = ? AND s.expires_at > ?",
      )
      .get(payload.sid, payload.sub, Date.now()) as UserRow | undefined;
    return row ? publicUser(row) : null;
  } catch {
    return null;
  }
}
export async function logout(db: DatabaseSync, token: string | undefined, secret: string) {
  if (!token) return;
  try {
    const payload = await verify(token, secret);
    if (typeof payload.sid === "string")
      db.prepare("DELETE FROM sessions WHERE id = ?").run(payload.sid);
  } catch {
    /* Expired tokens are already unusable. */
  }
}
export async function createAdmin(db: DatabaseSync, email: string, password: string) {
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) return;
  db.prepare(
    "INSERT INTO users (id,email,password_hash,role,preferences_set,created_at) VALUES (?,?,?,'admin',1,?)",
  ).run(randomUUID(), email.toLowerCase(), await bcrypt.hash(password, 12), Date.now());
}
