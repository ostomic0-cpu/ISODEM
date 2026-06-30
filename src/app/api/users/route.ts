import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "capas", "read");
  if ("error" in auth) return auth.error;
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, email: true, name: true, department: true },
    orderBy: { name: "asc" },
  });
  return Response.json(users);
}
