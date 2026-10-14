"use client";
import { ErrorState } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page-space">
      <ErrorState message="We couldn’t load this page. Please try again." retry={reset} />
    </div>
  );
}
