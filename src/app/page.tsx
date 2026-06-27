"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";

type DashboardData = {
  documents: Array<{ id: string; title: string; status: string; updatedAt: string }>;
  audits: Array<{ id: string; title: string; status: string; scheduleDate: string }>;
  capas: Array<{ id: string; status: string; targetDate: string; finding: { description: string } }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [documents, audits, capas] = await Promise.all([
          fetch("/api/documents").then((response) => response.json()),
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

  const kpis = [
    { label: "เอกสารทั้งหมด", value: data.documents.length },
    { label: "การตรวจประเมิน", value: data.audits.length },
    { label: "CAPA เปิดอยู่", value: data.capas.filter((capa) => capa.status !== "Closed").length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">แดชบอร์ด</h1>
        <p className="text-sm text-slate-500">ภาพรวมระบบบริหารคุณภาพ</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-3xl font-semibold">{kpi.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">กิจกรรมล่าสุด</h2>
        <div className="space-y-3">
          {data.documents.slice(0, 5).map((document) => (
            <div key={document.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="font-medium">{document.title}</p>
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
