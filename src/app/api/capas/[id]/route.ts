import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function dateIsPast(date: Date): boolean {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;
  const targetStr = typeof date === "string" ? date : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return targetStr < todayStr;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "capas", "read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const capa = await prisma.cAPA.findUnique({ where: { id }, include: { assignee: { select: { id: true, email: true, name: true, department: true, roleId: true, isActive: true, createdAt: true, updatedAt: true } }, finding: { include: { audit: true } }, department: { select: { id: true, name: true } } } });
  if (!capa) return Response.json({ error: "ไม่พบ CAPA" }, { status: 404 });
  return Response.json({
    ...capa,
    isOverdue: dateIsPast(capa.targetDate) && !["Closed", "Verified"].includes(capa.status),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "capas", "write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await request.json();

  // Build update data
  const data: Record<string, unknown> = {};
  if (body.rcaNotes !== undefined) data.rcaNotes = body.rcaNotes;
  if (body.actionPlan !== undefined) data.actionPlan = body.actionPlan;
  if (body.verificationNotes !== undefined) data.verificationNotes = body.verificationNotes;
  if (body.status !== undefined) data.status = body.status;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.targetDate !== undefined) data.targetDate = new Date(body.targetDate);
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (body.assigneeId !== undefined) {
    if (body.assigneeId) {
      const user = await prisma.user.findUnique({ where: { id: body.assigneeId }, select: { id: true } });
      if (!user) {
        return Response.json({ error: "ไม่พบผู้ใช้งานที่ระบุ" }, { status: 400 });
      }
    }
    data.assigneeId = body.assigneeId || auth.session.id;
  }

  if (body.departmentId !== undefined) {
    if (body.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: body.departmentId }, select: { id: true } });
      if (!dept) {
        return Response.json({ error: "ไม่พบแผนกที่ระบุ" }, { status: 400 });
      }
    }
    data.departmentId = body.departmentId || null;
  }

  const capa = await prisma.cAPA.update({
    where: { id },
    data,
  });
  if (body.status) {
    logActivity(auth.session.id, "capa.status_changed", {
      capaId: id,
      status: body.status,
    });
  }
  if (body.targetDate) {
    logActivity(auth.session.id, "capa.due_date_changed", {
      capaId: id,
      targetDate: body.targetDate,
    });
  }
  return Response.json(capa);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "capas", "delete");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.cAPA.delete({ where: { id } });
  return Response.json({ ok: true });
}
