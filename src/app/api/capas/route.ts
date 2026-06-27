import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "capas", "read");
  if ("error" in auth) return auth.error;
  const capas = await prisma.cAPA.findMany({ orderBy: { targetDate: "asc" }, include: { assignee: true, finding: { include: { audit: true } } } });
  return Response.json(capas);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, "capas", "write");
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const capa = await prisma.cAPA.create({
    data: {
      findingId: body.findingId,
      rcaNotes: body.rcaNotes,
      actionPlan: body.actionPlan,
      verificationNotes: body.verificationNotes || null,
      status: body.status || "Open",
      assigneeId: body.assigneeId || auth.session.id,
      targetDate: new Date(body.targetDate),
    },
  });
  return Response.json(capa, { status: 201 });
}
