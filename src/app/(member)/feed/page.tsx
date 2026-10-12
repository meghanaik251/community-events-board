import { Suspense } from "react";
import { EventBrowser } from "@/components/event-browser";
import { CardSkeletons } from "@/components/ui";
import { requirePageUser } from "@/server/page-auth";
export default async function FeedPage() {
  await requirePageUser();
  return (
    <Suspense
      fallback={
        <div className="container page-space">
          <CardSkeletons />
        </div>
      }
    >
      <EventBrowser feed />
    </Suspense>
  );
}
