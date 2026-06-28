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
  const capa = await prisma.cAPA.findUnique({ where: { id }, include: { assignee: true, finding: { include: { audit: true } } } });
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
  const capa = await prisma.cAPA.update({
    where: { id },
    data: {
      rcaNotes: body.rcaNotes,
      actionPlan: body.actionPlan,
      verificationNotes: body.verificationNotes,
      status: body.status,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
    },
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
