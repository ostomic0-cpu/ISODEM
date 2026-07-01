import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "capas", "read");
  if ("error" in auth) return auth.error;
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: { select: { name: true } }, department: true },
    orderBy: { name: "asc" },
  });
  return Response.json(users.map((u) => ({ id: u.id, name: u.name, role: u.role.name, department: u.department })));
}
