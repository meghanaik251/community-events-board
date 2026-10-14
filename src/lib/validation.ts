import { z } from "zod";
import { CATEGORIES, THEMES } from "./types";

export const credentialsSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((value) => value.trim().toLowerCase()),
    password: z
      .string()
      .min(10, "Use at least 10 characters")
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        "Password must be at most 72 bytes",
      ),
  })
  .strict();
export const eventInputSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    category: z.enum(CATEGORIES),
    city: z.string().trim().min(2).max(80),
    startsAt: z.iso.datetime({ offset: true }),
    pricePaise: z.number().int().min(0).max(100_000_000),
    description: z.string().trim().min(10).max(3000),
    imageUrl: z
      .url()
      .max(2048)
      .refine((value) => new URL(value).protocol === "https:", "Image URL must use HTTPS"),
  })
  .strict();
export const designSchema = z
  .object({
    theme: z.enum(THEMES),
    stickers: z.array(z.enum(["spark", "heart", "music", "flower", "bolt"])).max(3),
  })
  .strict();
export const favouritesSchema = z
  .object({ categories: z.array(z.enum(CATEGORIES)).max(5) })
  .strict();
export const reminderSchema = z.object({ reminded: z.boolean() }).strict();
export const activeSchema = z.object({ active: z.boolean() }).strict();
export const filtersSchema = z
  .object({
    category: z.enum(CATEGORIES).optional(),
    city: z.string().trim().max(80).optional(),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(24).default(6),
  })
  .strict();
