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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "dashboard", "read");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "Admin") {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  if (auth.session.id === id && body.isActive === false) {
    return Response.json({ error: "ไม่สามารถปิดใช้งานบัญชีตัวเองได้" }, { status: 400 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.department !== undefined) data.department = body.department;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
  if (body.role !== undefined) {
    const roleRecord = await prisma.role.findUnique({ where: { name: body.role } });
    if (!roleRecord) {
      return Response.json({ error: "บทบาทไม่ถูกต้อง" }, { status: 400 });
    }
    data.role = { connect: { id: roleRecord.id } };
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    logActivity(auth.session.id, "user.updated", { targetUserId: user.id, email: user.email, name: user.name });
    return Response.json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    return Response.json({ error: "อัปเดตผู้ใช้ไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "dashboard", "read");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "Admin") {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await params;
  if (auth.session.id === id) {
    return Response.json({ error: "ไม่สามารถปิดใช้งานบัญชีตัวเองได้" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, name: true },
    });
    logActivity(auth.session.id, "user.disabled", { targetUserId: id });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    return Response.json({ error: "ปิดใช้งานผู้ใช้ไม่สำเร็จ" }, { status: 500 });
  }
}
