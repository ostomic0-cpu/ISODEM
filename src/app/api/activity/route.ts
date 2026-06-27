import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (session.role !== "Admin" && session.role !== "QA") {
    return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)));

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, name: true, role: { select: { name: true } } } },
      },
    }),
    prisma.activityLog.count(),
  ]);

  return Response.json({
    activities,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
