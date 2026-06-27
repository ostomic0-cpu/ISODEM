import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "folders", "read");
  if ("error" in auth) return auth.error;
  const folders = await prisma.folder.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { documents: true } } } });
  return Response.json(folders);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, "folders", "write");
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const folder = await prisma.folder.create({
    data: { name: body.name, parentId: body.parentId || null },
  });
  return Response.json(folder, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiAuth(request, "folders", "write");
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const folder = await prisma.folder.update({
    where: { id: body.id },
    data: { name: body.name, parentId: body.parentId || null },
  });
  return Response.json(folder);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiAuth(request, "folders", "delete");
  if ("error" in auth) return auth.error;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "ไม่พบรหัสโฟลเดอร์" }, { status: 400 });
  await prisma.folder.delete({ where: { id } });
  return Response.json({ ok: true });
}
