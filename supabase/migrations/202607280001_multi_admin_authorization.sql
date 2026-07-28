create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select lower(coalesce((select auth.jwt()) ->> 'email', '')) in (
    'm.rossiflorent@gmail.com',
    'rossi.loic1@gmail.com'
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

drop policy if exists "Published portfolio is publicly readable"
on public.portfolio_documents;
drop policy if exists "Administrator can insert portfolio documents"
on public.portfolio_documents;
drop policy if exists "Administrator can update portfolio documents"
on public.portfolio_documents;
drop policy if exists "Administrator can delete portfolio documents"
on public.portfolio_documents;

create policy "Published portfolio is publicly readable"
on public.portfolio_documents
for select
to anon, authenticated
using (
  key = 'published'
  or (select public.is_portfolio_admin())
);

create policy "Administrator can insert portfolio documents"
on public.portfolio_documents
for insert
to authenticated
with check ((select public.is_portfolio_admin()));

create policy "Administrator can update portfolio documents"
on public.portfolio_documents
for update
to authenticated
using ((select public.is_portfolio_admin()))
with check ((select public.is_portfolio_admin()));

create policy "Administrator can delete portfolio documents"
on public.portfolio_documents
for delete
to authenticated
using ((select public.is_portfolio_admin()));

drop policy if exists "Administrator can upload portfolio media"
on storage.objects;
drop policy if exists "Administrator can update portfolio media"
on storage.objects;
drop policy if exists "Administrator can delete portfolio media"
on storage.objects;

create policy "Administrator can upload portfolio media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and (select public.is_portfolio_admin())
);

create policy "Administrator can update portfolio media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_portfolio_admin())
)
with check (
  bucket_id = 'portfolio-media'
  and (select public.is_portfolio_admin())
);

create policy "Administrator can delete portfolio media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_portfolio_admin())
);

drop function if exists public.publish_portfolio();
drop function if exists public.publish_portfolio(jsonb);

create function public.publish_portfolio(next_content jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_portfolio_admin()) then
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

revoke all on function public.publish_portfolio(jsonb)
from public, anon, service_role;
grant execute on function public.publish_portfolio(jsonb)
to authenticated;
