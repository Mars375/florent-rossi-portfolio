revoke all on function public.publish_portfolio()
from public, anon, service_role;
grant execute on function public.publish_portfolio()
to authenticated;
