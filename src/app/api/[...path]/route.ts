import { createApiHandler } from "@/server/api";
import { getSecret } from "@/server/auth";
import { getDb } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = (request: Request) =>
  createApiHandler({ db: getDb(), secret: getSecret() })(request);
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
