drop function if exists public.publish_portfolio();
drop function if exists public.publish_portfolio(jsonb);

create function public.publish_portfolio(next_content jsonb)
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

revoke all on function public.publish_portfolio(jsonb)
from public, anon, service_role;
grant execute on function public.publish_portfolio(jsonb)
to authenticated;
