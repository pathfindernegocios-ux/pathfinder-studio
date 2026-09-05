-- Garantiza privilegios para la tabla creations
grant all privileges on table public.creations to service_role;
grant all privileges on table public.creations to authenticated;
grant usage, select on all sequences in schema public to service_role, authenticated;
