import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "capas", "read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const capa = await prisma.cAPA.findUnique({ where: { id }, include: { assignee: true, finding: { include: { audit: true } } } });
  if (!capa) return Response.json({ error: "ไม่พบ CAPA" }, { status: 404 });
  return Response.json(capa);
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
  return Response.json(capa);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "capas", "delete");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.cAPA.delete({ where: { id } });
  return Response.json({ ok: true });
}
