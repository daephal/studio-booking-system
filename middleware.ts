import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/admin/login") ||
    request.nextUrl.pathname.startsWith("/api/admin/bootstrap-admin")
  ) {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured) {
    // Supabase 미설정 시엔 관리자 페이지 자체에서 "설정 필요" 안내를 표시하도록 통과시킴
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
