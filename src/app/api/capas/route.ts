import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function dateIsPast(date: Date): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10) < today;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "capas", "read");
  if ("error" in auth) return auth.error;
  const capas = await prisma.cAPA.findMany({ orderBy: { targetDate: "asc" }, include: { assignee: { select: { id: true, email: true, name: true, department: true, roleId: true, isActive: true, createdAt: true, updatedAt: true } }, finding: { include: { audit: true } }, department: { select: { id: true, name: true } } } });
  return Response.json(
    capas.map((capa) => ({
      ...capa,
      isOverdue: dateIsPast(capa.targetDate) && !["Closed", "Verified"].includes(capa.status),
    })),
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, "capas", "write");
  if ("error" in auth) return auth.error;
  const body = await request.json();

  // Validate departmentId if provided
  if (body.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: body.departmentId }, select: { id: true } });
    if (!dept) {
      return Response.json({ error: "ไม่พบแผนกที่ระบุ" }, { status: 400 });
    }
  }

  // Validate assigneeId if provided
  if (body.assigneeId) {
    const user = await prisma.user.findUnique({ where: { id: body.assigneeId }, select: { id: true } });
    if (!user) {
      return Response.json({ error: "ไม่พบผู้ใช้งานที่ระบุ" }, { status: 400 });
    }
  }

  const capa = await prisma.cAPA.create({
    data: {
      findingId: body.findingId,
      rcaNotes: body.rcaNotes,
      actionPlan: body.actionPlan,
      verificationNotes: body.verificationNotes || null,
      status: body.status || "Open",
      assigneeId: body.assigneeId || auth.session.id,
      departmentId: body.departmentId || null,
      priority: body.priority || "MEDIUM",
      targetDate: new Date(body.targetDate),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });
  logActivity(auth.session.id, "capa.created", { capaId: capa.id, findingId: capa.findingId, status: capa.status });
  return Response.json(capa, { status: 201 });
}
