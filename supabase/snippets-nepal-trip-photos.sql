-- Optional: put the real Nepal trip photos at the front of the Nepal gallery on the live site.
-- Safe to run more than once (skips photos that are already there). Run in Supabase -> SQL editor.
update destinations d
set gallery = (
  select coalesce(jsonb_agg(p), '[]'::jsonb) from jsonb_array_elements('[{"src": "/img/trips/nepal/phewa-group.webp", "caption": "Lavigo group at Phewa Lake, Pokhara"}, {"src": "/img/trips/nepal/phewa-boating.webp", "caption": "Boating on Phewa Lake"}, {"src": "/img/trips/nepal/manakamana-1.webp", "caption": "Manakamana temple"}, {"src": "/img/trips/nepal/hill-view.webp", "caption": "Morning view over the hills"}, {"src": "/img/trips/nepal/sky-swing.webp", "caption": "The sky swing"}]'::jsonb) p
  where not d.gallery @> jsonb_build_array(p)
) || d.gallery
where d.slug = 'nepal';
