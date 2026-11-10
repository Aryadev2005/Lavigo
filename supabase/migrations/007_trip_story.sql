-- 007: Trip story content. Lets the owner tell the story of a trip in /admin: a short story of
-- the place, highlights, the places visited, "good to know", a packing list, and richer
-- day-by-day detail. Run once in Supabase: SQL Editor -> paste -> Run. Safe to run more than once.
-- Needs 006 first.

-- ───────────── trips: story content ─────────────
alter table trips add column if not exists story text not null default '';                 -- 3-5 paragraphs
alter table trips add column if not exists highlights jsonb not null default '[]';          -- ["short highlight", ...]
alter table trips add column if not exists places jsonb not null default '[]';              -- [{name, about, image}]
alter table trips add column if not exists good_to_know jsonb not null default '[]';        -- [{title, text}]
alter table trips add column if not exists things_to_carry jsonb not null default '[]';     -- ["Warm jacket", ...]

-- Day-by-day detail lives inside the existing trips.itinerary jsonb array (no schema change:
-- jsonb is schemaless). Each day may now carry richer keys on top of the old {title, text}:
--   {title, text, description, highlights: [], meals, stay, travel, image}
-- The website and PDF read `description` when present and fall back to the old `text`, so trips
-- saved before this migration keep rendering exactly as before.
