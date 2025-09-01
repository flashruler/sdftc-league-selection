import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin pages, allow /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const auth = req.cookies.get("sdftc_admin_auth")?.value;
    if (auth === "1") {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
