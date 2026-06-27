import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, setAuthCookie, signSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      return Response.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    if (!user.isActive) {
      return Response.json({ error: "บัญชีผู้ใช้ถูกปิดใช้งาน" }, { status: 401 });
    }

    if (!(await comparePassword(password, user.passwordHash))) {
      return Response.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const token = await signSession({
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
      role: user.role.name,
    });
    const response = NextResponse.json({ ok: true });
    setAuthCookie(response, token);
    logActivity(user.id, "login.success", { email: user.email, name: user.name });
    return response;
  } catch {
    return Response.json({ error: "ไม่สามารถเข้าสู่ระบบได้" }, { status: 500 });
  }
}
