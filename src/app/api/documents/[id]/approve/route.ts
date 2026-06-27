import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth(request, "documents", "write");
  if ("error" in auth) return auth.error;
  const { id } = await params;

  if (auth.session.role !== "Admin" && auth.session.role !== "QA") {
    return Response.json({ error: "ไม่มีสิทธิ์อนุมัติเอกสารนี้" }, { status: 403 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, status: true, docNumber: true, title: true },
  });

  if (!document) return Response.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  if (document.status !== "InReview") {
    return Response.json({ error: "อนุมัติได้เฉพาะเอกสารที่อยู่ระหว่างตรวจ" }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      status: "Approved",
      approvalDate: new Date(),
      approvedById: auth.session.id,
    },
  });

  await logActivity(auth.session.id, "document.approved", {
    docNumber: document.docNumber,
    title: document.title,
  });

  return Response.json(updated);
}
