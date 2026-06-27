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
    return Response.json({ error: "ไม่มีสิทธิ์ปฏิเสธเอกสารนี้" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return Response.json({ error: "กรุณาระบุเหตุผลในการปฏิเสธ" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, status: true, docNumber: true, title: true },
  });

  if (!document) return Response.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  if (document.status !== "InReview") {
    return Response.json({ error: "ปฏิเสธได้เฉพาะเอกสารที่อยู่ระหว่างตรวจ" }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      status: "Draft",
      rejectReason: reason,
    },
  });

  await logActivity(auth.session.id, "document.rejected", {
    docNumber: document.docNumber,
    title: document.title,
    reason,
  });

  return Response.json(updated);
}
