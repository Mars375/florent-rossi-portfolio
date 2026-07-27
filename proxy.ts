import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { localeFromPathname, REQUEST_LOCALE_HEADER } from "./lib/request-locale";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const locale = localeFromPathname(request.nextUrl.pathname);
  if (locale) {
    requestHeaders.set(REQUEST_LOCALE_HEADER, locale);
  } else {
    requestHeaders.delete(REQUEST_LOCALE_HEADER);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const needsAuthRefresh =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/auth");

  if (!needsAuthRefresh || !url || !publishableKey) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        values.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/fr/:path*", "/en/:path*", "/admin/:path*", "/auth/:path*"],
};
