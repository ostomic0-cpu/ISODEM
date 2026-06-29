import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "departments", "read");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });

  if (!department) {
    return Response.json({ error: "ไม่พบแผนก" }, { status: 404 });
  }

  return Response.json(department);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "departments", "write");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "Admin") {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  // Build update payload
  const data: Prisma.DepartmentUpdateInput = {};

  if (body.name !== undefined) {
    const trimmedName = String(body.name).trim();
    if (trimmedName.length === 0) {
      return Response.json({ error: "ชื่อแผนกไม่สามารถว่างได้" }, { status: 400 });
    }

    // Check duplicate name (excluding self)
    const existing = await prisma.department.findUnique({ where: { name: trimmedName }, select: { id: true } });
    if (existing && existing.id !== id) {
      return Response.json({ error: "ชื่อแผนกนี้มีอยู่แล้ว" }, { status: 400 });
    }
    data.name = trimmedName;
  }

  if (body.parentId !== undefined) {
    const resolvedParentId = body.parentId || null;

    if (resolvedParentId) {
      // Prevent self-referencing
      if (resolvedParentId === id) {
        return Response.json({ error: "ไม่สามารถตั้งตัวเองเป็นแผนกหลักได้" }, { status: 400 });
      }

      // Verify parent exists
      const parent = await prisma.department.findUnique({ where: { id: resolvedParentId }, select: { id: true } });
      if (!parent) {
        return Response.json({ error: "ไม่พบแผนกหลัก" }, { status: 400 });
      }
    }

    data.parent =
      resolvedParentId
        ? { connect: { id: resolvedParentId } }
        : { disconnect: true };
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
  }

  try {
    const department = await prisma.department.update({
      where: { id },
      data,
    });

    logActivity(auth.session.id, "department.updated", { name: department.name });
    return Response.json(department);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "ไม่พบแผนก" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "departments", "delete");
  if ("error" in auth) return auth.error;
  if (auth.session.role !== "Admin") {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await params;

  // Check for children
  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { children: true } } },
  });

  if (!department) {
    return Response.json({ error: "ไม่พบแผนก" }, { status: 404 });
  }

  if (department._count.children > 0) {
    return Response.json({ error: "ไม่สามารถลบแผนกที่มีแผนกย่อยได้" }, { status: 400 });
  }

  try {
    await prisma.department.delete({ where: { id } });
    logActivity(auth.session.id, "department.deleted", { name: department.name });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "ไม่พบแผนก" }, { status: 404 });
    }
    throw error;
  }
}
