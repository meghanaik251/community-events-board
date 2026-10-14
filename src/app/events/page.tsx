import { Suspense } from "react";
import { EventBrowser } from "@/components/event-browser";
import { CardSkeletons } from "@/components/ui";
export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="container page-space">
          <CardSkeletons />
        </div>
      }
    >
      <EventBrowser />
    </Suspense>
  );
}
