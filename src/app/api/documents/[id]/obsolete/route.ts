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

  if (auth.session.role !== "Admin") {
    return Response.json({ error: "ไม่มีสิทธิ์เก็บถาวรเอกสารนี้" }, { status: 403 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, status: true, docNumber: true, title: true },
  });

  if (!document) return Response.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  if (document.status !== "Approved") {
    return Response.json({ error: "เก็บถาวรได้เฉพาะเอกสารที่อนุมัติแล้ว" }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: { status: "Obsolete" },
  });

  await logActivity(auth.session.id, "document.obsoleted", {
    docNumber: document.docNumber,
    title: document.title,
  });

  return Response.json(updated);
}
