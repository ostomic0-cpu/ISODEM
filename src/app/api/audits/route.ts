import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "audits", "read");
  if ("error" in auth) return auth.error;
  const audits = await prisma.audit.findMany({
    orderBy: { scheduleDate: "desc" },
    include: { auditor: true, findings: { include: { capa: true } } },
  });
  return Response.json(audits);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, "audits", "write");
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const audit = await prisma.audit.create({
    data: {
      title: body.title,
      scheduleDate: new Date(body.scheduleDate),
      status: body.status || "Scheduled",
      auditorId: body.auditorId || auth.session.id,
      checklistData: body.checklistData || "[]",
    },
  });
  return Response.json(audit, { status: 201 });
}
