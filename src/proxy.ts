import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = [
    "/login",
    "/register",
    "/",
    "/privacy",
    "/terms",
    "/forgot-password",
    "/reset-password",
  ];
  // Prefixes that must stay reachable without a session: API endpoints (e.g.
  // the health check hit by uptime monitors) and the Supabase auth callback.
  const publicPrefixes = ["/api/", "/auth/"];
  const isPublicRoute =
    publicRoutes.some((route) => path === route) ||
    publicPrefixes.some((prefix) => path.startsWith(prefix));

  // If not logged in and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If logged in, check role-based routing
  if (user && (path === "/login" || path === "/register" || path === "/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, companies!profiles_company_id_fkey(type)")
      .eq("id", user.id)
      .single();

    if (profile) {
      const url = request.nextUrl.clone();

      if (!profile.company_id) {
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      const companyType = (profile.companies as unknown as { type: string } | null)?.type;
      url.pathname = companyType === "supplier" ? "/supplier/dashboard" : "/restaurant/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Prevent supplier from accessing restaurant routes and vice versa
  if (user && (path.startsWith("/supplier") || path.startsWith("/restaurant"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, companies!profiles_company_id_fkey(type)")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      const companyType = (profile.companies as unknown as { type: string } | null)?.type;

      if (companyType === "supplier" && path.startsWith("/restaurant")) {
        const url = request.nextUrl.clone();
        url.pathname = "/supplier/dashboard";
        return NextResponse.redirect(url);
      }
      if (companyType === "restaurant" && path.startsWith("/supplier")) {
        const url = request.nextUrl.clone();
        url.pathname = "/restaurant/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
