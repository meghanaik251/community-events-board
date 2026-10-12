"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/types";
import { api } from "@/lib/client-api";
import { useApi } from "./use-api";
import { useAuth } from "./providers";
import { CategoryIcon, ErrorState } from "./ui";

const descriptions = {
  Music: "Live sets & good vibrations",
  Workshop: "Make, learn & get inspired",
  Food: "New flavours & shared tables",
  Sports: "Move more, meet more",
  Kids: "Little people, big adventures",
};
export function Preferences() {
  const { data, loading, error, retry } = useApi<{ categories: Category[] }>("/favourites");
  const [selected, setSelected] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const router = useRouter();
  const { refresh } = useAuth();
  useEffect(() => {
    if (data) setSelected(data.categories);
  }, [data]);
  async function save() {
    setBusy(true);
    setSaveError("");
    try {
      await api("/favourites", { method: "PUT", body: { categories: selected } });
      await refresh();
      router.push("/feed");
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container preferences-page">
      <div className="centered-intro">
        <span className="eyebrow">
          <Sparkles size={16} /> Make it your own
        </span>
        <h1>What brings you out?</h1>
        <p>
          Pick the things you love. We’ll fill your feed with more of them.
          <br />
          You can change these any time.
        </p>
      </div>
      {error ? (
        <ErrorState message={error} retry={retry} />
      ) : (
        <>
          <div className="interest-grid" aria-busy={loading}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                disabled={loading || busy}
                onClick={() =>
                  setSelected((values) =>
                    values.includes(category)
                      ? values.filter((v) => v !== category)
                      : [...values, category],
                  )
                }
                aria-pressed={selected.includes(category)}
                className={`interest-card category-${category.toLowerCase()} ${selected.includes(category) ? "picked" : ""}`}
              >
                <span className="interest-icon">
                  <CategoryIcon category={category} size={29} />
                </span>
                <span className="interest-check">
                  {selected.includes(category) && <Check size={14} />}
                </span>
                <strong>{category}</strong>
                <small>{descriptions[category]}</small>
              </button>
            ))}
          </div>
          <div className="preferences-actions">
            <p aria-live="polite">
              {selected.length
                ? `${selected.length} ${selected.length === 1 ? "interest" : "interests"} selected. Good taste.`
                : "Pick a favourite, or start with an empty feed."}
            </p>
            {saveError && (
              <p role="alert" className="message error">
                {saveError}
              </p>
            )}
            <button className="button button-primary" onClick={save} disabled={loading || busy}>
              {busy ? "Saving…" : "Save my interests"}
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
