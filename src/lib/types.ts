export const CATEGORIES = ["Music", "Workshop", "Food", "Sports", "Kids"] as const;
export type Category = (typeof CATEGORIES)[number];
export const THEMES = ["sage", "lilac", "sunset"] as const;
export const STICKERS = {
  spark: "✨",
  heart: "💛",
  music: "🎵",
  flower: "🌼",
  bolt: "⚡",
} as const;
export type CardDesign = { theme: (typeof THEMES)[number]; stickers: (keyof typeof STICKERS)[] };
export type User = { id: string; email: string; role: "user" | "admin"; preferencesSet: boolean };
export type EventInput = {
  title: string;
  category: Category;
  city: string;
  startsAt: string;
  pricePaise: number;
  description: string;
  imageUrl: string;
};
export type CommunityEvent = EventInput & { id: string; active: boolean; reminded: boolean };
export type EventResults = {
  events: CommunityEvent[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};
export type EventFilters = {
  category?: Category;
  city?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  admin?: boolean;
  feed?: boolean;
};
