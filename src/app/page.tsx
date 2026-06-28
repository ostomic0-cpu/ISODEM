"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";

type DashboardData = {
  documents: Array<{ id: string; title: string; status: string; updatedAt: string }>;
  audits: Array<{ id: string; title: string; status: string; scheduleDate: string; isOverdue?: boolean }>;
  capas: Array<{ id: string; status: string; targetDate: string; isOverdue?: boolean; finding: { description: string } }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [documents, audits, capas] = await Promise.all([
          fetch("/api/documents").then((response) => response.json()).then((body) => body.documents ?? []),
          fetch("/api/audits").then((response) => response.json()),
          fetch("/api/capas").then((response) => response.json()),
        ]);
        setData({ documents, audits, capas });
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
          {data.documents.slice(0, 5).map((document) => (
            <div key={document.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p>
                  <Link href={"/documents/" + document.id} className="font-medium hover:text-teal-700">
                    {document.title}
                  </Link>
                </p>
                <p className="text-sm text-slate-500">อัปเดต {formatDate(document.updatedAt)}</p>
              </div>
              <StatusBadge status={document.status} />
            </div>
          ))}
          {data.documents.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีกิจกรรม</p> : null}
        </div>
      </Card>
    </div>
  );
}
