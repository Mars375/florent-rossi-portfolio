drop policy if exists "Portfolio media is publicly readable"
on storage.objects;

revoke all on table public.portfolio_documents from anon, authenticated;
grant select on table public.portfolio_documents to anon;
grant select, insert, update, delete
on table public.portfolio_documents
to authenticated;

create index if not exists portfolio_documents_updated_by_idx
on public.portfolio_documents (updated_by);

revoke all on function public.publish_portfolio()
from public, anon, service_role;
grant execute on function public.publish_portfolio()
to authenticated;
