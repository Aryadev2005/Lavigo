-- Public bucket for photos uploaded from /admin (uploads happen server-side with the service role).
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
