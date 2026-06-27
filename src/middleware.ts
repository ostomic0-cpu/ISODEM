import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

const routeModules: Array<[RegExp, string]> = [
  [/^\/folders/, "folders"],
  [/^\/documents/, "documents"],
  [/^\/audits/, "audits"],
  [/^\/capas/, "capas"],
  [/^\/$/, "dashboard"],
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const moduleName = routeModules.find(([pattern]) => pattern.test(pathname))?.[1];
  if (moduleName && session.role === "Engineer" && moduleName === "folders") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
