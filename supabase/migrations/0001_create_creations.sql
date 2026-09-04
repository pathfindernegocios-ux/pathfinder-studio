-- =====================================================
-- Tabla: creations
-- Descripción: Creaciones guardadas por el usuario.
--              Solo metadatos, el video vive en R2.
-- =====================================================

create table if not exists public.creations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text,
  seed bigint,
  duration text,
  resolution text,
  aspect_ratio text,
  guide_scale numeric,
  match_audio_dur boolean default false,
  model text,
  engine text,
  input_start_image text,
  input_end_image text,
  input_audio text,
  storage_key text,
  status text not null default 'processing',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- Índices para consultas comunes
create index if not exists idx_creations_user_created on public.creations(user_id, created_at desc);
create index if not exists idx_creations_status on public.creations(status);
create index if not exists idx_creations_expires_at on public.creations(expires_at);

-- Seguridad a nivel de filas
alter table public.creations enable row level security;

-- Políticas RLS
create policy "Users can view own creations"
  on public.creations for select
  using (auth.uid() = user_id);

create policy "Users can insert own creations"
  on public.creations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own creations"
  on public.creations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own creations"
  on public.creations for delete
  using (auth.uid() = user_id);