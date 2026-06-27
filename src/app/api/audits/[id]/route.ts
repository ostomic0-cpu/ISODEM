import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "audits", "read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const audit = await prisma.audit.findUnique({ where: { id }, include: { auditor: true, findings: { include: { capa: true } } } });
  if (!audit) return Response.json({ error: "ไม่พบการตรวจประเมิน" }, { status: 404 });
  return Response.json(audit);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "audits", "write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await request.json();
  const audit = await prisma.audit.update({
    where: { id },
    data: {
      title: body.title,
      scheduleDate: body.scheduleDate ? new Date(body.scheduleDate) : undefined,
      status: body.status,
      checklistData: body.checklistData,
    },
  });
  return Response.json(audit);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "audits", "write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await request.json();
  const finding = await prisma.auditFinding.create({
    data: {
      auditId: id,
      type: body.type || "NC",
      description: body.description,
      status: body.status || "Open",
    },
  });
  return Response.json(finding, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "audits", "delete");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.audit.delete({ where: { id } });
  return Response.json({ ok: true });
}
