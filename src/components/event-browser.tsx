"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { CATEGORIES, type EventResults } from "@/lib/types";
import { useApi } from "./use-api";
import { CardSkeletons, CategoryIcon, EmptyState, ErrorState } from "./ui";
import { EventCard } from "./event-card";

export function EventBrowser({ feed = false }: { feed?: boolean }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const query = params.toString();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const [search, setSearch] = useState(q);
  const update = useCallback(
    (changes: Record<string, string>) => {
      // Native history updates synchronously, so quick successive filters compose.
      const next = new URLSearchParams(window.location.search);
      next.delete("page");
      Object.entries(changes).forEach(([key, value]) =>
        value ? next.set(key, value) : next.delete(key),
      );
      window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
    },
    [pathname],
  );
  useEffect(() => {
    setSearch(q);
  }, [q]);
  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => update({ q: search }), 300);
    return () => clearTimeout(timer);
  }, [search, q, update]);
  const { data, error, loading, retry } = useApi<EventResults>(
    `${feed ? "/feed" : "/events"}?${query}`,
  );
  const { data: metadata } = useApi<{ cities: string[] }>("/events/meta");
  const hasFilters = Boolean(q || category || city);
  function clear() {
    setSearch("");
    window.history.replaceState(null, "", pathname);
  }
  return (
    <div className="container discover-page">
      {feed ? (
        <section className="feed-hero">
          <div>
            <span className="eyebrow">
              <Sparkles size={15} /> A little more you
            </span>
            <h1>
              Your interests.
              <br />
              <span>Your kind of plans.</span>
            </h1>
            <p>Good things, picked from the categories you love.</p>
          </div>
          <Link href="/preferences" className="button button-outline">
            <SlidersHorizontal size={17} /> Edit my interests
          </Link>
        </section>
      ) : (
        <section className="discover-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="live-dot" /> Big little moments, nearby
            </span>
            <h1>
              Good things happen
              <br />
              <span>close to home.</span>
              <svg className="hero-underline" viewBox="0 0 320 18" aria-hidden="true">
                <path d="M4 11 Q150 -4 316 10 M38 16 Q175 5 292 14" />
              </svg>
            </h1>
            <p>
              Meet your people. Try something new.
              <br />
              Find the moments that make your city feel like home.
            </p>
            <a href="#browse" className="hero-link">
              Find your next plan <ArrowDown size={16} />
            </a>
            <div className="community-note">
              <div className="mini-avatars">
                <span>☺</span>
                <span>✿</span>
                <span>☀</span>
              </div>
              <span>Local plans. Real connections.</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit" />
            <span className="art-flower">✳</span>
            <div className="hero-photo">
              <img
                src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=85"
                alt=""
                referrerPolicy="no-referrer"
              />
              <div className="photo-caption">
                <span>Less scrolling.</span>
                <strong>More showing up.</strong>
              </div>
            </div>
            <div className="floating-note">
              <span>👋</span>
              <div>
                <strong>Your people are out there.</strong>
                <small>Let’s find them.</small>
              </div>
            </div>
            <div className="tiny-label">A little outside your everyday ↗</div>
          </div>
        </section>
      )}
      <section id="browse" className="browse-section" aria-labelledby="browse-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{feed ? "Picked for you" : "Make room for a good time"}</span>
            <h2 id="browse-title">
              {feed ? "Your next good memory" : "What’s happening around you"}
              <span className="heading-dot">.</span>
            </h2>
          </div>
          <span className="sort-note">Upcoming, soonest first</span>
        </div>
        <div className="filter-panel">
          <div className="filter-top">
            <label className="search-field">
              <Search size={19} />
              <span className="sr-only">Search events</span>
              <input
                type="search"
                aria-label="Search events"
                placeholder="Search for a moment, a mood, a plan…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="city-field">
              <MapPin size={18} />
              <span className="sr-only">Filter by city</span>
              <select
                aria-label="Filter by city"
                value={city}
                onChange={(event) => update({ city: event.target.value })}
              >
                <option value="">All cities</option>
                {city && !metadata?.cities.includes(city) && <option value={city}>{city}</option>}
                {metadata?.cities.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="category-filters" aria-label="Filter by category">
            <button
              className={`category-pill ${!category ? "selected" : ""}`}
              aria-pressed={!category}
              onClick={() => update({ category: "" })}
            >
              <CategoryIcon />
              All events
            </button>
            {CATEGORIES.map((item) => (
              <button
                key={item}
                aria-pressed={category === item}
                className={`category-pill ${category === item ? "selected" : ""}`}
                onClick={() => update({ category: item })}
              >
                <CategoryIcon category={item} />
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="results-bar" aria-live="polite">
          <span>
            {loading ? (
              "Finding your next plan…"
            ) : data ? (
              <>
                <strong>{data.pagination.total}</strong>{" "}
                {data.pagination.total === 1 ? "event" : "events"} to look forward to
              </>
            ) : (
              ""
            )}
          </span>
          {hasFilters && (
            <button className="text-button" onClick={clear}>
              Clear filters
            </button>
          )}
        </div>
        {loading ? (
          <CardSkeletons />
        ) : error ? (
          <ErrorState message={error} retry={retry} />
        ) : data?.events.length ? (
          <>
            <div className="event-grid">
              {data.events.map((event) => (
                <EventCard event={event} key={`${event.id}-${event.reminded}`} />
              ))}
            </div>
            {data.pagination.totalPages > 1 && (
              <nav className="pagination" aria-label="Event pages">
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={data.pagination.page === 1}
                  onClick={() => update({ page: String(data.pagination.page - 1) })}
                >
                  <ArrowLeft size={19} />
                </button>
                <span>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => update({ page: String(data.pagination.page + 1) })}
                >
                  <ArrowRight size={19} />
                </button>
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            title={
              hasFilters
                ? "No events found"
                : feed
                  ? "Your next plan is still out there"
                  : "Good things are on their way"
            }
            description={
              hasFilters
                ? "Try a different city, category, or search. There’s more to discover."
                : feed
                  ? "Choose your favourite categories, or explore all upcoming events."
                  : "There are no upcoming events just yet. Check back soon."
            }
          >
            {hasFilters ? (
              <button className="button button-primary" onClick={clear}>
                Clear filters
              </button>
            ) : (
              <Link className="button button-primary" href={feed ? "/preferences" : "/events"}>
                {feed ? "Choose my interests" : "Refresh events"}
                <ArrowRight size={17} />
              </Link>
            )}
          </EmptyState>
        )}
      </section>
      <div className="closing-note">
        <span>✳</span>
        <p>
          The best part of your city?<strong> The people you haven’t met yet.</strong>
        </p>
      </div>
    </div>
  );
}
