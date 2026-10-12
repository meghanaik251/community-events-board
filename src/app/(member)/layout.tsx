import { requirePageUser } from "@/server/page-auth";
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser();
  return children;
}
