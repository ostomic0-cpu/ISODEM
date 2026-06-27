import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const userSelect = {
  id: true,
  email: true,
  name: true,
  department: true,
  roleId: true,
  role: { select: { name: true } },
  isActive: true,
  createdAt: true,
};

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "dashboard", "read");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "Admin") {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
  return Response.json(users);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, "dashboard", "read");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "Admin") {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { email, name, department, role, password } = await request.json();
  if (!email || !name || !department || !role || !password) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return Response.json({ error: "อีเมลนี้มีผู้ใช้แล้ว" }, { status: 400 });
  }

  const roleRecord = await prisma.role.findUnique({ where: { name: role } });
  if (!roleRecord) {
    return Response.json({ error: "บทบาทไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, department, roleId: roleRecord.id, passwordHash },
      select: userSelect,
    });
    logActivity(auth.session.id, "user.created", { email: user.email, name: user.name, role });
    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "อีเมลนี้มีผู้ใช้แล้ว" }, { status: 400 });
    }
    return Response.json({ error: "สร้างผู้ใช้ไม่สำเร็จ" }, { status: 500 });
  }
}
