"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, severityLabels, severityColors, priorityLabels, priorityColors } from "@/lib/utils";

type DashboardFinding = { severity: string };
type DashboardAudit = { id: string; title: string; status: string; scheduleDate: string; isOverdue?: boolean; findings: DashboardFinding[] };
type DashboardCapa = { id: string; status: string; targetDate: string; dueDate?: string | null; isOverdue?: boolean; priority: string; finding: { description: string } };
type DashboardData = {
  documents: Array<{ id: string; title: string; status: string; updatedAt: string }>;
  audits: DashboardAudit[];
  capas: DashboardCapa[];
  activities: Array<{ id: string; action: string; userId: string; user: { id: string; email: string; name: string; role: { name: string } }; metadata: string; createdAt: string }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [documents, audits, capas, activityRes] = await Promise.all([
          fetch("/api/documents").then((response) => response.json()).then((body) => body.documents ?? []),
          fetch("/api/audits").then((response) => response.json()),
          fetch("/api/capas").then((response) => response.json()),
          fetch("/api/activity?limit=5"),
        ]);
        const activities = activityRes.ok ? (await activityRes.json()).activities ?? [] : [];
        setData({ documents, audits, capas, activities });
      } catch {
        setError("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
      }
    }
    load();
  }, []);

  if (error) return <p className="rounded-md bg-rose-50 p-4 text-rose-700">{error}</p>;
  if (!data) return <p className="text-slate-500">กำลังโหลดแดชบอร์ด...</p>;

  const overdueAudits = data.audits.filter((audit) => audit.isOverdue);
  const overdueCapas = data.capas.filter((capa) => capa.isOverdue);
  const overdueCount = overdueAudits.length + overdueCapas.length;

  const overdueItems: Array<{
    id: string;
    type: "audit" | "capa";
    title: string;
    date: string;
    status: string;
  }> = [
    ...overdueAudits.map((a) => ({
      id: a.id,
      type: "audit" as const,
      title: a.title,
      date: a.scheduleDate,
      status: a.status,
    })),
    ...overdueCapas.map((c) => ({
      id: c.id,
      type: "capa" as const,
      title: c.finding?.description || "CAPA",
      date: c.targetDate,
      status: c.status,
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);
  const kpis = [
    { label: "เอกสารทั้งหมด", value: data.documents.length },
    { label: "การตรวจประเมิน", value: data.audits.length },
    { label: "CAPA เปิดอยู่", value: data.capas.filter((capa) => capa.status !== "Closed").length },
    { label: "เกินกำหนด", value: overdueCount, urgent: true },
  ];

  const severityCounts: Record<string, number> = {};
  for (const audit of data.audits) {
    for (const finding of audit.findings) {
      const sev = finding.severity || "OBS";
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    }
  }
  const severityOrder = ["OBS", "OFI", "MINOR", "MAJOR", "CAR"];

  const priorityCounts: Record<string, number> = {};
  for (const capa of data.capas) {
    const pri = capa.priority || "MEDIUM";
    priorityCounts[pri] = (priorityCounts[pri] || 0) + 1;
  }
  const priorityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">แดชบอร์ด</h1>
        <p className="text-sm text-slate-500">ภาพรวมระบบบริหารคุณภาพ</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-slate-500">{kpi.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${kpi.urgent ? "text-red-600" : ""}`}>{kpi.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">ข้อค้นพบแยกตามความรุนแรง</h2>
          <div className="flex flex-wrap gap-2">
            {severityOrder.map((sev) => (
              <span key={sev} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${severityColors[sev] || "bg-slate-100 text-slate-700"}`}>
                {severityLabels[sev] || sev}
                <span className="ml-0.5 font-bold">{severityCounts[sev] || 0}</span>
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">CAPA แยกตามความสำคัญ</h2>
          <div className="flex flex-wrap gap-2">
            {priorityOrder.map((pri) => (
              <span key={pri} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${priorityColors[pri] || "bg-slate-100 text-slate-600"}`}>
                {priorityLabels[pri] || pri}
                <span className="ml-0.5 font-bold">{priorityCounts[pri] || 0}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">รายการเกินกำหนด</h2>
          {overdueCount > 0 ? (
            <span className="text-sm text-slate-500">{overdueCount} รายการ</span>
          ) : null}
        </div>
        <div className="mt-3 space-y-2">
          {overdueItems.length > 0 ? (
            <>
              {overdueItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.type === "audit" ? `/audits/${item.id}` : `/capas/${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                          item.type === "audit"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.type === "audit" ? "การตรวจประเมิน" : "CAPA"}
                      </span>
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.title}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      วันที่กำหนด:{" "}
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              ))}
              {overdueCount > overdueItems.length ? (
                <p className="text-center text-xs text-slate-400">
                  และอีก {overdueCount - overdueItems.length} รายการ
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">✅ ไม่มีรายการที่เกินกำหนด</p>
          )}
        </div>
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold">กิจกรรมล่าสุด</h2>
        <div className="space-y-3">
          {data.activities.slice(0, 5).map((activity) => {
            const labels: Record<string, string> = {
              "login.success": "เข้าสู่ระบบ",
              "document.created": "สร้างเอกสาร",
              "document.submitted": "ส่งตรวจสอบ",
              "document.approved": "อนุมัติเอกสาร",
              "document.rejected": "ปฏิเสธเอกสาร",
              "document.obsoleted": "ลบล้างเอกสาร",
              "revision.created": "เพิ่มเวอร์ชัน",
              "user.created": "สร้างผู้ใช้",
              "user.updated": "แก้ไขผู้ใช้",
              "user.disabled": "ปิดใช้งานผู้ใช้",
              "audit.created": "สร้างตรวจประเมิน",
              "audit.status_changed": "เปลี่ยนสถานะตรวจประเมิน",
              "capa.created": "สร้าง CAPA",
              "capa.status_changed": "เปลี่ยนสถานะ CAPA",
              "capa.due_date_changed": "เปลี่ยนกำหนดแล้วเสร็จ",
              "department.created": "สร้างแผนก",
              "department.updated": "แก้ไขแผนก",
              "department.deleted": "ลบแผนก",
            };
            return (
              <div key={activity.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{activity.user?.name || "ระบบ"}</span>
                    <span className="text-slate-500">
                      {" "}{labels[activity.action] || activity.action}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
            );
          })}
          {data.activities.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีกิจกรรม</p> : null}
        </div>
      </Card>
    </div>
  );
}
