import { Preferences } from "@/components/preferences";
import { requirePageUser } from "@/server/page-auth";
export default async function PreferencesPage() {
  await requirePageUser();
  return <Preferences />;
}
