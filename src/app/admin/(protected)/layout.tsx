import { requirePageUser } from "@/server/page-auth";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(true);
  return children;
}
