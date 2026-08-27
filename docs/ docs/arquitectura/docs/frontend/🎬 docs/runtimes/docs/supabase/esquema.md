# Esquema de Supabase

## Tabla `runtimes`

| Columna      | Tipo        | Descripción                                |
|--------------|-------------|--------------------------------------------|
| `id`         | uuid        | PK autogenerado                            |
| `station_id` | text        | Identificador de la estación (ej: PF-0001)|
| `gradio_url` | text        | URL pública de Gradio                      |
| `state`      | text        | Estado del runtime (`READY`, `BUSY`, etc.)|
| `created_at` | timestamptz | Fecha de creación                          |

## Políticas RLS

- `allow_anon_insert`: permitir inserción al rol anon.
- `allow_anon_select`: permitir lectura al rol anon.

## SQL de creación

```sql
create table runtimes (
  id uuid primary key default gen_random_uuid(),
  station_id text not null,
  gradio_url text not null,
  state text not null,
  created_at timestamptz default now()
);

alter table runtimes enable row level security;

create policy "allow_anon_insert" on runtimes for insert to anon with check (true);
create policy "allow_anon_select" on runtimes for select to anon using (true);

grant usage on schema public to anon;
grant select, insert on public.runtimes to anon;
