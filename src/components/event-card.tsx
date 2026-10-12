"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Bell, BellRing, MapPin } from "lucide-react";
import { useState } from "react";
import type { CommunityEvent } from "@/lib/types";
import { dateParts, formatDate, formatPrice } from "@/lib/format";
import { api } from "@/lib/client-api";
import { useAuth } from "./providers";
import { CategoryIcon } from "./ui";

export function ReminderButton({ event }: { event: CommunityEvent }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [reminded, setReminded] = useState(event.reminded);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const previous = reminded;
    setReminded(!previous);
    setPending(true);
    setError("");
    try {
      await api(`/events/${event.id}/reminder`, { method: "PUT", body: { reminded: !previous } });
    } catch (e) {
      setReminded(previous);
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="reminder-wrap">
      <button
        className={`reminder ${reminded ? "is-saved" : ""}`}
        onClick={toggle}
        disabled={pending || loading}
        aria-pressed={reminded}
        aria-label={reminded ? "Reminder saved" : "Remind me"}
      >
        {reminded ? <BellRing size={16} /> : <Bell size={16} />}
        <span>{reminded ? "Reminder saved" : "Remind me"}</span>
      </button>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function EventImage({
  event,
  className = "",
}: {
  event: CommunityEvent;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`event-image category-${event.category.toLowerCase()} ${className}`}>
      {failed ? (
        <div className="image-fallback">
          <CategoryIcon category={event.category} size={58} />
          <span>Find your people.</span>
        </div>
      ) : (
        <img
          src={event.imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
export function EventCard({ event }: { event: CommunityEvent }) {
  const date = dateParts(event.startsAt);
  return (
    <article className="event-card" data-testid="event-card">
      <div className="card-visual">
        <EventImage event={event} />
        <span className="category-badge">
          <CategoryIcon category={event.category} size={14} />
          {event.category}
        </span>
        <div className="date-badge">
          <strong>{date.day}</strong>
          <span>{date.month}</span>
        </div>
      </div>
      <div className="card-content">
        <p className="event-date">{formatDate(event.startsAt)}</p>
        <h3>
          <Link href={`/events/${event.id}`}>
            {event.title}
            <ArrowUpRight size={19} />
          </Link>
        </h3>
        <p className="event-location">
          <MapPin size={15} />
          {event.city}
        </p>
        <div className="card-bottom">
          <span className={`price ${event.pricePaise === 0 ? "free" : ""}`}>
            {formatPrice(event.pricePaise)}
            {event.pricePaise > 0 && <small> / person</small>}
          </span>
          <ReminderButton event={event} />
        </div>
      </div>
    </article>
  );
}
