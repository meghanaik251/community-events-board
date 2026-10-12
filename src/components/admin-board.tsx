"use client";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Plus, Search, X, ArrowLeft, ArrowRight } from "lucide-react";
import { CATEGORIES, type CommunityEvent, type EventResults } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { api } from "@/lib/client-api";
import { useApi } from "./use-api";
import { CategoryIcon, EmptyState, ErrorState } from "./ui";

function EventForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/admin/events", {
        method: "POST",
        body: {
          title: String(form.get("title")),
          category: String(form.get("category")),
          city: String(form.get("city")),
          startsAt: new Date(`${form.get("date")}:00+05:30`).toISOString(),
          pricePaise: Math.round(Number(form.get("price")) * 100),
          imageUrl: String(form.get("imageUrl")),
          description: String(form.get("description")),
        },
      });
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="event-form-section" aria-labelledby="event-form-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Bring people together</span>
          <h2 id="event-form-title">A new reason to show up.</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close event form"
          onClick={onClose}
          disabled={busy}
        >
          <X />
        </button>
      </div>
      <form className="stack-form admin-form" onSubmit={submit}>
        <label className="full-width">
          Event title
          <input
            name="title"
            minLength={3}
            maxLength={120}
            required
            placeholder="Give your gathering a good name"
            autoFocus
          />
        </label>
        <label>
          Category
          <select aria-label="Category" name="category" defaultValue="Music">
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          City
          <input name="city" minLength={2} maxLength={80} required placeholder="e.g. Coimbatore" />
        </label>
        <label>
          Date and time (IST)
          <input name="date" type="datetime-local" required />
        </label>
        <label>
          Price (₹)
          <input
            aria-label="Price (₹)"
            name="price"
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            required
            defaultValue="0"
          />
          <span className="field-hint">Set to 0 for a free event.</span>
        </label>
        <label className="full-width">
          Image URL
          <input
            aria-label="Image URL"
            name="imageUrl"
            type="url"
            pattern="https://.*"
            maxLength={2048}
            required
            placeholder="https://…"
          />
          <span className="field-hint">Use a publicly accessible HTTPS image.</span>
        </label>
        <label className="full-width">
          Description
          <textarea
            name="description"
            minLength={10}
            maxLength={3000}
            required
            rows={4}
            placeholder="What should your neighbours know?"
          />
        </label>
        {error && (
          <p role="alert" className="message error full-width">
            {error}
          </p>
        )}
        <div className="form-actions full-width">
          <button className="button button-outline" type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Publishing…" : "Publish event"}
            <Plus size={17} />
          </button>
        </div>
      </form>
    </section>
  );
}
function AdminEvent({ event, onChanged }: { event: CommunityEvent; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await api(`/admin/events/${event.id}`, { method: "PATCH", body: { active: !event.active } });
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-event" data-testid="admin-event">
      <div className={`admin-category category-${event.category.toLowerCase()}`}>
        <CategoryIcon category={event.category} size={24} />
      </div>
      <div className="admin-event-title">
        <h3>{event.title}</h3>
        <p>
          {event.category} <span>·</span> {event.city}
          <span>·</span>
          {formatPrice(event.pricePaise)}
        </p>
      </div>
      <div className="admin-event-date">
        {formatDate(event.startsAt)}
        <small>{Date.parse(event.startsAt) <= Date.now() ? "Past event" : "Upcoming"}</small>
      </div>
      <span className={`status-badge ${event.active ? "active" : "inactive"}`}>
        <i />
        {event.active ? "Active" : "Inactive"}
      </span>
      <button className="button button-small button-outline" onClick={toggle} disabled={busy}>
        {busy ? "Saving…" : event.active ? "Make inactive" : "Make active"}
      </button>
      {error && (
        <p className="inline-error full-width" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function AdminBoard() {
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const { data, loading, error, retry } = useApi<EventResults>(
    `/admin/events?pageSize=8&page=${page}&q=${encodeURIComponent(query)}`,
  );
  function created() {
    setFormOpen(false);
    setNotice("Event published");
    setPage(1);
    retry();
  }
  return (
    <div className="container admin-page">
      <section className="admin-hero">
        <div>
          <span className="eyebrow">Behind the good times</span>
          <h1>
            Your community,
            <br />
            coming together.
          </h1>
          <p>Give your neighbours something to look forward to.</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => {
            setFormOpen(true);
            setNotice("");
          }}
          disabled={formOpen}
        >
          <Plus size={18} />
          Add event
        </button>
      </section>
      {notice && (
        <p className="message success" role="status">
          <CheckCircle2 size={18} />
          {notice}
        </p>
      )}
      {formOpen && <EventForm onClose={() => setFormOpen(false)} onCreated={created} />}
      <section className="admin-list-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">All your plans, in one place</span>
            <h2>
              Manage events<span className="heading-dot">.</span>
            </h2>
          </div>
          <span className="small-note">Inactive and past events stay here.</span>
        </div>
        <label className="search-field admin-search">
          <Search size={19} />
          <span className="sr-only">Search admin events</span>
          <input
            type="search"
            aria-label="Search admin events"
            placeholder="Find an event…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {loading ? (
          <div role="status" className="admin-loading">
            Loading your events…
          </div>
        ) : error ? (
          <ErrorState message={error} retry={retry} />
        ) : data?.events.length ? (
          <>
            <div className="admin-list">
              {data.events.map((event) => (
                <AdminEvent key={event.id} event={event} onChanged={retry} />
              ))}
            </div>
            <nav className="pagination" aria-label="Admin event pages">
              <button
                className="icon-button"
                aria-label="Previous admin page"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ArrowLeft size={18} />
              </button>
              <span>
                Page {page} of {data.pagination.totalPages}
              </span>
              <button
                className="icon-button"
                aria-label="Next admin page"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ArrowRight size={18} />
              </button>
            </nav>
          </>
        ) : (
          <EmptyState
            title="No events here yet"
            description={
              query
                ? "Try another search."
                : "Add your first event and give the community a reason to gather."
            }
          />
        )}
      </section>
    </div>
  );
}
