import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE = "qms_session";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "qms-local-development-secret-change-me");

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  department: string;
  role: string;
};

type TokenPayload = JWTPayload & SessionUser;

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function signSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<TokenPayload>(token, secret);
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      department: payload.department,
      role: payload.role,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(AUTH_COOKIE)?.value);
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireApiAuth(request: NextRequest, module: string, action: string) {
  const session = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (!session) {
    return { error: Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) as Response };
  }

  const allowed =
    session.role === "Admin" ||
    (await prisma.permission.findFirst({
      where: {
        role: { name: session.role },
        module,
        action: { in: action === "write" ? ["write", "write-own"] : [action] },
      },
    }));

  if (!allowed) {
    return { error: Response.json({ error: "ไม่มีสิทธิ์ดำเนินการ" }, { status: 403 }) as Response };
  }

  return { session };
}
