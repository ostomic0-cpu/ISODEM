import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { validateUpload } from "@/lib/upload-validation";

const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
const ownerSelect = { id: true, email: true, name: true, department: true, roleId: true, isActive: true, createdAt: true, updatedAt: true };

async function generateDocNumber(tx: Prisma.TransactionClient, category: string): Promise<string> {
  const year = new Date().getFullYear();
  let counter = await tx.documentCounter.findUnique({
    where: { category_year: { category, year } },
  });
  if (!counter) {
    counter = await tx.documentCounter.create({
      data: { category, year, nextSequence: 1 },
    });
  }
  const seq = counter.nextSequence;
  await tx.documentCounter.update({
    where: { id: counter.id },
    data: { nextSequence: seq + 1 },
  });
  return `${category}-${year}-${String(seq).padStart(3, "0")}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "documents", "read");
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const status = url.searchParams.get("status") || "";
  const department = url.searchParams.get("department") || "";
  const folderId = url.searchParams.get("folderId") || "";
  const sortBy = url.searchParams.get("sortBy") || "updatedAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)));

  const where: Prisma.DocumentWhereInput = {};
  if (q) where.OR = [{ docNumber: { contains: q } }, { title: { contains: q } }];
  if (category) where.category = category;
  if (status) where.status = status;
  if (department) where.department = { contains: department };
  if (folderId) where.folderId = folderId;

  const allowedSortFields = ["createdAt", "updatedAt", "docNumber", "title", "status"] as const;
  const field = allowedSortFields.includes(sortBy as typeof allowedSortFields[number]) ? sortBy : "updatedAt";
  const orderBy = { [field]: sortOrder === "asc" ? "asc" : "desc" } as const;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: ownerSelect },
        folder: true,
        versions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return Response.json({
    documents,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, "documents", "write");
  if ("error" in auth) return auth.error;
  const form = await request.formData();
  const file = form.get("file");
  const validation = validateUpload(file);
  if (!validation.valid) return Response.json({ error: validation.error }, { status: validation.status });

  let storedFilename: string;
  let filePath: string;
  try {
    await mkdir(uploadDir, { recursive: true });
    const ext = path.extname(validation.file.name);
    storedFilename = `${randomUUID()}${ext}`;
    filePath = `/uploads/documents/${storedFilename}`;
    await writeFile(path.join(uploadDir, storedFilename), Buffer.from(await validation.file.arrayBuffer()));
  } catch {
    return Response.json({ error: "ไม่สามารถบันทึกไฟล์ได้ กรุณาลองอีกครั้ง" }, { status: 500 });
  }

  const category = String(form.get("category") || "SOP");
  const requestedDocNumber = String(form.get("docNumber") ?? "").trim();
  const canOverrideDocNumber = requestedDocNumber && (auth.session.role === "Admin" || auth.session.role === "QA");
  const documentData = (docNumber: string) => ({
    docNumber,
      title: String(form.get("title") ?? ""),
      category,
      status: "Draft",
      department: String(form.get("department") ?? auth.session.department),
      ownerId: auth.session.id,
      folderId: String(form.get("folderId") ?? "root-folder"),
      versions: {
        create: {
          versionNumber: String(form.get("versionNumber") || "1.0"),
          originalFilename: validation.file.name,
          storedFilename,
          filePath,
          changeSummary: String(form.get("changeSummary") || "สร้างเอกสารใหม่"),
          status: "Draft",
          submittedById: auth.session.id,
        },
      },
  });

  try {
    if (canOverrideDocNumber) {
      const existing = await prisma.document.findUnique({
        where: { docNumber: requestedDocNumber },
        select: { id: true },
      });
      if (existing) {
        return Response.json({ error: "เลขที่เอกสารนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
      }

      const document = await prisma.document.create({
        data: documentData(requestedDocNumber),
        include: { versions: true },
      });
      await logActivity(auth.session.id, "document.created", { docNumber: document.docNumber, title: document.title });
      return Response.json(document, { status: 201 });
    }

    const document = await prisma.$transaction(async (tx) => {
      const docNumber = await generateDocNumber(tx, category);
      return tx.document.create({
        data: documentData(docNumber),
        include: { versions: true },
      });
    });

    await logActivity(auth.session.id, "document.created", { docNumber: document.docNumber, title: document.title });
    return Response.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "เลขที่เอกสารนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }
    return Response.json({ error: "บันทึกเอกสารไม่สำเร็จ" }, { status: 500 });
  }
}
