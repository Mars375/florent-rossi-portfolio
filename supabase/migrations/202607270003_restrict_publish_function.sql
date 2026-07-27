revoke all on function public.publish_portfolio(jsonb)
from public, anon, service_role;
grant execute on function public.publish_portfolio(jsonb)
to authenticated;
