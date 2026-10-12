"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Cloud, Sparkles, X } from "lucide-react";
import { STICKERS, THEMES, type CardDesign, type CommunityEvent } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/client-api";
import { useAuth } from "./providers";
import { useApi } from "./use-api";
import { CategoryIcon, ErrorState } from "./ui";

export function CardDesigner({ event }: { event: CommunityEvent }) {
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error, retry } = useApi<{ design: CardDesign }>(
    user ? `/events/${event.id}/design` : null,
  );
  const [design, setDesign] = useState<CardDesign>({ theme: "sage", stickers: [] });
  const [status, setStatus] = useState("saved");
  const [saveError, setSaveError] = useState("");
  const version = useRef(0);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    if (data) setDesign(data.design);
  }, [data]);
  function change(next: CardDesign) {
    setDesign(next);
    if (!user) return;
    const revision = ++version.current;
    setStatus("saving");
    setSaveError("");
    // Serialize saves: a slow older request must never overwrite a newer design.
    queue.current = queue.current.then(async () => {
      try {
        await api(`/events/${event.id}/design`, { method: "PUT", body: next });
        if (revision === version.current) setStatus("saved");
      } catch (e) {
        if (revision === version.current) {
          setStatus("error");
          setSaveError((e as Error).message);
        }
      }
    });
  }
  const busy = loading || authLoading;
  return (
    <section className="designer-section" aria-labelledby="designer-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> Put your spin on it
          </span>
          <h2 id="designer-title">
            Design your card<span className="heading-dot">.</span>
          </h2>
        </div>
        <span className="small-note">A little keepsake, your way.</span>
      </div>
      {error ? (
        <ErrorState message={error} retry={retry} />
      ) : (
        <div className="designer-grid">
          <div className="designer-preview-wrap">
            <div className={`designer-preview theme-${design.theme}`} data-testid="card-preview">
              <div className="preview-top">
                <span className="preview-brand">around.</span>
                <span>YOU’RE INVITED</span>
              </div>
              <span className="preview-category">
                <CategoryIcon category={event.category} size={17} />
                {event.category}
              </span>
              <h3>{event.title}</h3>
              <p>{event.city}</p>
              <div className="preview-bottom">
                <span>{formatDate(event.startsAt)}</span>
                <span>See you there ↗</span>
              </div>
              <div className="preview-stickers">
                {design.stickers.map((sticker, index) => (
                  <button
                    className={`placed-sticker sticker-${index}`}
                    key={`${sticker}-${index}`}
                    aria-label={`Remove ${sticker} sticker`}
                    disabled={busy}
                    onClick={() =>
                      change({ ...design, stickers: design.stickers.filter((_, i) => i !== index) })
                    }
                  >
                    {STICKERS[sticker]}
                    <span>
                      <X size={10} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="preview-decoration" aria-hidden="true">
                ✳
              </div>
            </div>
          </div>
          <div className="designer-controls">
            <div className="control-group">
              <span className="control-label">
                <b>01</b> Choose a background
              </span>
              <div className="theme-options">
                {THEMES.map((theme) => (
                  <button
                    key={theme}
                    className={`theme-option theme-${theme} ${design.theme === theme ? "chosen" : ""}`}
                    disabled={busy}
                    aria-label={`${theme[0].toUpperCase() + theme.slice(1)} theme`}
                    aria-pressed={design.theme === theme}
                    onClick={() => change({ ...design, theme })}
                  >
                    <span>{design.theme === theme && <Check size={17} />}</span>
                    <small>{theme}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="control-group">
              <span className="control-label">
                <b>02</b> Add a little personality
              </span>
              <p className="field-hint">Pick up to 3 stickers. Tap one on the card to remove it.</p>
              <div className="sticker-options">
                {(Object.keys(STICKERS) as (keyof typeof STICKERS)[]).map((sticker) => (
                  <button
                    key={sticker}
                    disabled={busy || design.stickers.length >= 3}
                    aria-label={`Add ${sticker} sticker`}
                    onClick={() => change({ ...design, stickers: [...design.stickers, sticker] })}
                  >
                    {STICKERS[sticker]}
                  </button>
                ))}
              </div>
              <span className="sticker-count">{design.stickers.length} / 3 stickers added</span>
            </div>
            <div className="save-status" aria-live="polite">
              {busy ? (
                "Loading your design…"
              ) : !user ? (
                <p>
                  <Link href={`/login?next=/events/${event.id}`}>Sign in</Link> to save your design
                  for next time.
                </p>
              ) : status === "saving" ? (
                <>
                  <Cloud size={16} /> Saving your design…
                </>
              ) : status === "saved" ? (
                <>
                  <CheckCircle2 size={16} /> All changes saved
                </>
              ) : (
                <div role="alert">
                  <p>{saveError}</p>
                  <button className="text-button" onClick={() => change(design)}>
                    Retry save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
