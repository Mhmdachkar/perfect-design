-- Rename clients.country → city (location field)
ALTER TABLE public.clients RENAME COLUMN country TO city;
