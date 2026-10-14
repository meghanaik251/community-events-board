"use client";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Ticket, Users } from "lucide-react";
import type { CommunityEvent } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { useApi } from "./use-api";
import { EventImage, ReminderButton } from "./event-card";
import { CategoryIcon, ErrorState } from "./ui";
import { CardDesigner } from "./card-designer";

export function EventDetail({ id }: { id: string }) {
  const { data, loading, error, retry } = useApi<{ event: CommunityEvent }>(`/events/${id}`);
  return (
    <div className="container detail-page">
      <Link className="back-link" href="/events">
        <ArrowLeft size={17} /> Back to all events
      </Link>
      {loading ? (
        <div className="detail-skeleton" role="status">
          Loading a good time…
        </div>
      ) : error ? (
        <ErrorState message={error} retry={retry} />
      ) : (
        data && (
          <>
            <div className="detail-top">
              <div className="detail-cover">
                <EventImage event={data.event} />
                <span className="category-badge">
                  <CategoryIcon category={data.event.category} size={15} />
                  {data.event.category}
                </span>
              </div>
              <div className="detail-intro">
                <span className="eyebrow">A plan worth making</span>
                <h1>{data.event.title}</h1>
                <div className="event-facts">
                  <p>
                    <CalendarDays />
                    <span>
                      {formatDate(data.event.startsAt)}
                      <small>Indian Standard Time</small>
                    </span>
                  </p>
                  <p>
                    <MapPin />
                    <span>
                      {data.event.city}
                      <small>In your neighbourhood</small>
                    </span>
                  </p>
                  <p>
                    <Ticket />
                    <span>
                      {formatPrice(data.event.pricePaise)}
                      <small>
                        {data.event.pricePaise ? "per person" : "No entry fee. Just show up."}
                      </small>
                    </span>
                  </p>
                </div>
                <div className="detail-reminder">
                  <ReminderButton event={data.event} />
                  <p>Save a reminder to your account.</p>
                </div>
              </div>
            </div>
            <section className="about-event">
              <div>
                <h2>A little about the plan</h2>
                <p>{data.event.description}</p>
              </div>
              <div className="community-callout">
                <Users size={26} />
                <h3>Come as you are.</h3>
                <p>New faces are always welcome. Bring a friend, or make one here.</p>
              </div>
            </section>
            <CardDesigner event={data.event} />
          </>
        )
      )}
    </div>
  );
}
