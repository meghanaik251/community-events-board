import { createHash, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
  activeSchema,
  credentialsSchema,
  designSchema,
  eventInputSchema,
  favouritesSchema,
  filtersSchema,
  reminderSchema,
} from "@/lib/validation";
import type { User } from "@/lib/types";
import { authenticate, login, logout, SESSION_COOKIE, SESSION_SECONDS, signup } from "./auth";
import {
  createEvent,
  getCities,
  getDesign,
  getEvent,
  getFavourites,
  listEvents,
  saveDesign,
  setEventActive,
  setFavourites,
  setReminder,
} from "./events";
import { AppError } from "./errors";
import { logger } from "./logger";

type Dependencies = { db: DatabaseSync; secret: string; logging?: boolean };
type Context = Dependencies & { request: Request; user: User | null; token?: string; id?: string };
type Result = { body: unknown; status?: number; cookie?: string };
type Route = {
  method: string;
  path: RegExp;
  access: "public" | "user" | "admin";
  run: (context: Context) => Promise<Result> | Result;
};

export function tokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization)
    return authorization.startsWith("Bearer ") ? authorization.slice(7) : "invalid";
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
}
const cookie = (token: string, maxAge = SESSION_SECONDS) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`;

async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    throw new AppError(415, "JSON_REQUIRED", "Send an application/json request body");
  // Read incrementally so a missing Content-Length cannot bypass the size limit.
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) {
        await reader.cancel();
        throw new AppError(413, "BODY_TOO_LARGE", "Request body is too large");
      }
      chunks.push(value);
    }
  }
  let value: unknown;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(400, "INVALID_JSON", "The request body is not valid JSON");
  }
  return schema.parse(value);
}
function limitAuth(db: DatabaseSync, email: string) {
  const now = Date.now();
  const key = createHash("sha256").update(email.toLowerCase()).digest("hex");
  db.prepare("DELETE FROM rate_limits WHERE resets_at <= ?").run(now);
  const entry = db.prepare("SELECT attempts FROM rate_limits WHERE key=?").get(key);
  if (Number(entry?.attempts ?? 0) >= 10)
    throw new AppError(429, "RATE_LIMITED", "Too many attempts. Please try again in 15 minutes");
  db.prepare(
    "INSERT INTO rate_limits (key,attempts,resets_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1",
  ).run(key, now + 15 * 60_000);
}
const filters = (request: Request) =>
  filtersSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
const routes: Route[] = [
  ...(["signup", "login"] as const).map((action) => ({
    method: "POST",
    path: new RegExp(`^/auth/${action}$`),
    access: "public" as const,
    async run(c: Context) {
      const credentials = await body(c.request, credentialsSchema);
      limitAuth(c.db, credentials.email);
      const result = await (action === "signup" ? signup : login)(c.db, credentials, c.secret);
      return {
        body: result,
        status: action === "signup" ? 201 : 200,
        cookie: cookie(result.token),
      };
    },
  })),
  {
    method: "GET",
    path: /^\/auth\/me$/,
    access: "public",
    run: (c) => ({ body: { user: c.user } }),
  },
  {
    method: "POST",
    path: /^\/auth\/logout$/,
    access: "public",
    async run(c) {
      await logout(c.db, c.token, c.secret);
      return { body: { success: true }, cookie: cookie("", 0) };
    },
  },
  {
    method: "GET",
    path: /^\/events$/,
    access: "public",
    run: (c) => ({ body: listEvents(c.db, filters(c.request), c.user?.id) }),
  },
  {
    method: "GET",
    path: /^\/events\/meta$/,
    access: "public",
    run: (c) => ({ body: { cities: getCities(c.db) } }),
  },
  {
    method: "GET",
    path: /^\/events\/([^/]+)$/,
    access: "public",
    run: (c) => ({ body: { event: getEvent(c.db, c.id!, c.user?.id) } }),
  },
  {
    method: "GET",
    path: /^\/feed$/,
    access: "user",
    run: (c) => ({ body: listEvents(c.db, { ...filters(c.request), feed: true }, c.user!.id) }),
  },
  {
    method: "GET",
    path: /^\/favourites$/,
    access: "user",
    run: (c) => ({ body: { categories: getFavourites(c.db, c.user!.id) } }),
  },
  {
    method: "PUT",
    path: /^\/favourites$/,
    access: "user",
    async run(c) {
      const input = await body(c.request, favouritesSchema);
      return { body: { categories: setFavourites(c.db, c.user!.id, input.categories) } };
    },
  },
  {
    method: "PUT",
    path: /^\/events\/([^/]+)\/reminder$/,
    access: "user",
    async run(c) {
      const input = await body(c.request, reminderSchema);
      return { body: setReminder(c.db, c.user!.id, c.id!, input.reminded) };
    },
  },
  {
    method: "GET",
    path: /^\/events\/([^/]+)\/design$/,
    access: "user",
    run: (c) => ({ body: { design: getDesign(c.db, c.user!.id, c.id!) } }),
  },
  {
    method: "PUT",
    path: /^\/events\/([^/]+)\/design$/,
    access: "user",
    async run(c) {
      const input = await body(c.request, designSchema);
      return { body: { design: saveDesign(c.db, c.user!.id, c.id!, input) } };
    },
  },
  {
    method: "GET",
    path: /^\/admin\/events$/,
    access: "admin",
    run: (c) => ({ body: listEvents(c.db, { ...filters(c.request), admin: true }, c.user!.id) }),
  },
  {
    method: "POST",
    path: /^\/admin\/events$/,
    access: "admin",
    async run(c) {
      const input = await body(c.request, eventInputSchema);
      return { body: { event: createEvent(c.db, input) }, status: 201 };
    },
  },
  {
    method: "PATCH",
    path: /^\/admin\/events\/([^/]+)$/,
    access: "admin",
    async run(c) {
      const input = await body(c.request, activeSchema);
      return { body: setEventActive(c.db, c.id!, input.active) };
    },
  },
];

export function createApiHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const started = performance.now();
    const requestId = randomUUID();
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "").replace(/\/$/, "");
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
    });
    let result: Result;
    try {
      const matching = routes.filter((route) => route.path.test(path));
      const route = matching.find((route) => route.method === request.method);
      if (!route) {
        if (matching.length) headers.set("Allow", matching.map((item) => item.method).join(", "));
        throw new AppError(
          matching.length ? 405 : 404,
          matching.length ? "METHOD_NOT_ALLOWED" : "NOT_FOUND",
          matching.length ? "Method not allowed" : "Endpoint not found",
        );
      }
      const token = tokenFromRequest(request);
      const user = await authenticate(deps.db, token, deps.secret);
      if (request.headers.has("authorization") && !user)
        throw new AppError(401, "UNAUTHORIZED", "Please sign in again");
      if (route.access !== "public" && !user)
        throw new AppError(401, "UNAUTHORIZED", "Please sign in to continue");
      if (route.access === "admin" && user?.role !== "admin")
        throw new AppError(403, "FORBIDDEN", "Admin access is required");
      if (
        !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
        !request.headers.has("authorization")
      ) {
        const origin = request.headers.get("origin");
        // Next may normalize request.url to localhost. Host is the browser's
        // actual destination; deployments behind a proxy set APP_ORIGIN explicitly.
        const expectedOrigin =
          process.env.APP_ORIGIN || `${url.protocol}//${request.headers.get("host") || url.host}`;
        if ((origin && origin !== expectedOrigin) || (!origin && token))
          throw new AppError(403, "INVALID_ORIGIN", "This request origin is not allowed");
      }
      result = await route.run({ ...deps, request, user, token, id: path.match(route.path)?.[1] });
    } catch (error) {
      if (error instanceof z.ZodError)
        result = {
          status: 400,
          body: {
            error: {
              code: "VALIDATION_ERROR",
              message: error.issues[0]?.message || "Check your input",
              fields: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
              })),
              requestId,
            },
          },
        };
      else if (error instanceof AppError)
        result = {
          status: error.status,
          body: { error: { code: error.code, message: error.message, requestId } },
        };
      else {
        if (deps.logging !== false) logger.error({ requestId, err: error }, "api.unexpected_error");
        result = {
          status: 500,
          body: {
            error: {
              code: "INTERNAL_ERROR",
              message: "Something went wrong. Please try again",
              requestId,
            },
          },
        };
      }
    }
    if (result.cookie) headers.set("Set-Cookie", result.cookie);
    if (result.status === 429) headers.set("Retry-After", "900");
    if (deps.logging !== false)
      logger.info(
        {
          requestId,
          method: request.method,
          path,
          status: result.status ?? 200,
          durationMs: Math.round(performance.now() - started),
        },
        "api.request",
      );
    return new Response(JSON.stringify(result.body), { status: result.status ?? 200, headers });
  };
}
