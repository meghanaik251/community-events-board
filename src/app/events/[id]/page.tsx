import { EventDetail } from "@/components/event-detail";
export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return <EventDetail id={(await params).id} />;
}
