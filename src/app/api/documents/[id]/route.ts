import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
const userSelect = { id: true, email: true, name: true, department: true, roleId: true, createdAt: true, updatedAt: true };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "documents", "read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: userSelect },
      folder: true,
      versions: {
        orderBy: { createdAt: "desc" },
        include: {
          submittedBy: { select: userSelect },
          approvedBy: { select: userSelect },
        },
      },
    },
  });
  if (!document) return Response.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
  return Response.json(document);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "documents", "write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await request.json();
  const document = await prisma.document.update({
    where: { id },
    data: {
      title: body.title,
      category: body.category,
      status: body.status,
      department: body.department,
      folderId: body.folderId,
    },
  });
  return Response.json(document);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "documents", "write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "กรุณาแนบไฟล์" }, { status: 400 });
  await mkdir(uploadDir, { recursive: true });
  const storedFilename = `${randomUUID()}${path.extname(file.name)}`;
  const filePath = `/uploads/documents/${storedFilename}`;
  await writeFile(path.join(uploadDir, storedFilename), Buffer.from(await file.arrayBuffer()));
  const version = await prisma.documentVersion.create({
    data: {
      documentId: id,
      versionNumber: String(form.get("versionNumber") || "1.0"),
      originalFilename: file.name,
      storedFilename,
      filePath,
      changeSummary: String(form.get("changeSummary") || "เพิ่มเวอร์ชันใหม่"),
      status: "InReview",
      submittedById: auth.session.id,
    },
  });
  logActivity(auth.session.id, "revision.created", { documentId: id, versionNumber: version.versionNumber });
  return Response.json(version, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "documents", "delete");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.document.delete({ where: { id } });
  return Response.json({ ok: true });
}
