"use client";
import {
  ArrowRight,
  CalendarDays,
  Flower2,
  Music2,
  Paintbrush,
  SearchX,
  Trophy,
  Utensils,
  AlertCircle,
} from "lucide-react";
import type { Category } from "@/lib/types";
import type { ReactNode } from "react";

export function CategoryIcon({ category, size = 18 }: { category?: Category; size?: number }) {
  const Icon = category
    ? { Music: Music2, Workshop: Paintbrush, Food: Utensils, Sports: Trophy, Kids: Flower2 }[
        category
      ]
    : CalendarDays;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <span className="empty-icon">
        <AlertCircle />
      </span>
      <h2>Something didn’t go to plan</h2>
      <p>{message}</p>
      {retry && (
        <button className="button button-primary" onClick={retry}>
          Try again <ArrowRight size={17} />
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <SearchX />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function CardSkeletons() {
  return (
    <div className="event-grid" role="status" aria-label="Loading events">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="card-skeleton" key={i}>
          <div />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
