import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "departments", "read");
  if ("error" in auth) return auth.error;

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true } },
    },
  });

  return Response.json(departments);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, "departments", "write");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "Admin") {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { name, parentId } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "กรุณาระบุชื่อแผนก" }, { status: 400 });
  }

  const trimmedName = name.trim();

  // Check duplicate name
  const existing = await prisma.department.findUnique({ where: { name: trimmedName }, select: { id: true } });
  if (existing) {
    return Response.json({ error: "ชื่อแผนกนี้มีอยู่แล้ว" }, { status: 400 });
  }

  // Build create data
  const data: { name: string; parentId?: string } = { name: trimmedName };
  const resolvedParentId = parentId || null;
  if (resolvedParentId) {
    const parent = await prisma.department.findUnique({ where: { id: resolvedParentId }, select: { id: true } });
    if (!parent) {
      return Response.json({ error: "ไม่พบแผนกหลัก" }, { status: 400 });
    }
    data.parentId = resolvedParentId;
  }

  const department = await prisma.department.create({ data });

  logActivity(auth.session.id, "department.created", { name: department.name });
  return Response.json(department, { status: 201 });
}
