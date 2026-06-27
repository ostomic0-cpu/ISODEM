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

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, status: true, ownerId: true, docNumber: true, title: true },
  });

  if (!document) return Response.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  if (
    document.ownerId !== auth.session.id &&
    auth.session.role !== "Admin" &&
    auth.session.role !== "QA"
  ) {
    return Response.json({ error: "ไม่มีสิทธิ์ส่งเอกสารนี้" }, { status: 403 });
  }

  if (document.status !== "Draft") {
    return Response.json({ error: "เฉพาะเอกสารฉบับร่างเท่านั้นที่ส่งตรวจได้" }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: { status: "InReview" },
  });

  await logActivity(auth.session.id, "document.submitted", {
    docNumber: document.docNumber,
    title: document.title,
  });

  return Response.json(updated);
}
