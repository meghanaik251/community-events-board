import { AdminBoard } from "@/components/admin-board";
import { requirePageUser } from "@/server/page-auth";
export default async function AdminPage() {
  await requirePageUser(true);
  return <AdminBoard />;
}
