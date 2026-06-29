import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { validateUpload } from "@/lib/upload-validation";

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
      departmentRel: { select: { id: true, name: true } },
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
  const currentDocument = await prisma.document.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!currentDocument) return Response.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
  if (currentDocument.status === "Approved" || currentDocument.status === "Obsolete") {
    return Response.json({ error: "เอกสารที่อนุมัติหรือเก็บถาวรแล้วไม่สามารถแก้ไขได้" }, { status: 400 });
  }

  // Build update data
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.category !== undefined) data.category = body.category;
  if (body.status !== undefined) data.status = body.status;
  if (body.department !== undefined) data.department = body.department;
  if (body.folderId !== undefined) data.folderId = body.folderId;

  if (body.departmentId !== undefined) {
    if (body.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: body.departmentId }, select: { id: true } });
      if (!dept) {
        return Response.json({ error: "ไม่พบแผนกที่ระบุ" }, { status: 400 });
      }
    }
    data.departmentId = body.departmentId || null;
  }

  const document = await prisma.document.update({
    where: { id },
    data,
  });
  return Response.json(document);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "documents", "write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("file");
  const validation = validateUpload(file);
  if (!validation.valid) return Response.json({ error: validation.error }, { status: validation.status });
  const currentDocument = await prisma.document.findUnique({
    where: { id },
    select: { id: true, status: true, docNumber: true },
  });
  if (!currentDocument) return Response.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  let storedFilename: string;
  let filePath: string;
  try {
    await mkdir(uploadDir, { recursive: true });
    storedFilename = `${randomUUID()}${path.extname(validation.file.name)}`;
    filePath = `/uploads/documents/${storedFilename}`;
    await writeFile(path.join(uploadDir, storedFilename), Buffer.from(await validation.file.arrayBuffer()));
  } catch {
    return Response.json({ error: "ไม่สามารถบันทึกไฟล์ได้ กรุณาลองอีกครั้ง" }, { status: 500 });
  }
  const version = await prisma.$transaction(async (tx) => {
    const createdVersion = await tx.documentVersion.create({
      data: {
        documentId: id,
        versionNumber: String(form.get("versionNumber") || "1.0"),
        originalFilename: validation.file.name,
        storedFilename,
        filePath,
        changeSummary: String(form.get("changeSummary") || "เพิ่มเวอร์ชันใหม่"),
        status: "InReview",
        submittedById: auth.session.id,
      },
    });

    if (currentDocument.status === "Approved") {
      await tx.document.update({
        where: { id },
        data: { status: "InReview" },
      });
    }

    return createdVersion;
  });
  await logActivity(auth.session.id, "revision.created", {
    docNumber: currentDocument.docNumber,
    versionNumber: version.versionNumber,
  });
  return Response.json(version, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, "documents", "delete");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  await prisma.document.delete({ where: { id } });
  return Response.json({ ok: true });
}
