create table if not exists public.portfolio_documents (
  key text primary key check (key in ('draft', 'published')),
  content jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.portfolio_documents enable row level security;

revoke all on table public.portfolio_documents from anon, authenticated;
grant select on table public.portfolio_documents to anon;
grant select, insert, update, delete on table public.portfolio_documents to authenticated;

create index if not exists portfolio_documents_updated_by_idx
on public.portfolio_documents (updated_by);

create policy "Published portfolio is publicly readable"
on public.portfolio_documents
for select
to anon, authenticated
using (
  key = 'published'
  or lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
);

create policy "Administrator can insert portfolio documents"
on public.portfolio_documents
for insert
to authenticated
with check (
  lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
);

create policy "Administrator can update portfolio documents"
on public.portfolio_documents
for update
to authenticated
using (
  lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
)
with check (
  lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
);

create policy "Administrator can delete portfolio documents"
on public.portfolio_documents
for delete
to authenticated
using (
  lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
);

create or replace function public.publish_portfolio(next_content jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if lower(coalesce((select auth.jwt()) ->> 'email', '')) <> 'm.rossiflorent@gmail.com' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if next_content is null then
    raise exception 'content is required' using errcode = '22004';
  end if;

  insert into public.portfolio_documents (key, content, updated_by)
  values
    ('draft', next_content, (select auth.uid())),
    ('published', next_content, (select auth.uid()))
  on conflict (key) do update
  set content = excluded.content,
      updated_at = now(),
      updated_by = excluded.updated_by;
end;
$$;

revoke all on function public.publish_portfolio(jsonb) from public, anon, service_role;
grant execute on function public.publish_portfolio(jsonb) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Administrator can upload portfolio media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
);

create policy "Administrator can update portfolio media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
)
with check (
  bucket_id = 'portfolio-media'
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
);

create policy "Administrator can delete portfolio media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'm.rossiflorent@gmail.com'
);
