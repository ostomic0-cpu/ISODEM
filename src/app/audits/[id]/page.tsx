"use client";

import { use, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

type Finding = { id: string; type: string; description: string; status: string; capa?: { id: string } | null };
type AuditDetail = { id: string; title: string; scheduleDate: string; status: string; isOverdue?: boolean; findings: Finding[] };

const statusBanners: Record<string, { label: string; className: string }> = {
  Scheduled: { label: "วางแผนแล้ว", className: "border-blue-200 bg-blue-50 text-blue-900" },
  InProgress: { label: "กำลังดำเนินการ", className: "border-amber-200 bg-amber-50 text-amber-900" },
  Completed: { label: "เสร็จสิ้น", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  Cancelled: { label: "ยกเลิก", className: "border-rose-200 bg-rose-50 text-rose-900" },
};

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadAudit() {
      setLoading(true);
      const response = await fetch(`/api/audits/${id}`);
      if (!response.ok) setError("โหลดรายละเอียดการตรวจไม่สำเร็จ");
      else setAudit(await response.json());
      setLoading(false);
    }

    loadAudit();
  }, [id, reloadKey]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(`/api/audits/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    setSaving(false);
    if (!response.ok) setError("เพิ่มข้อค้นพบไม่สำเร็จ");
    else {
      event.currentTarget.reset();
      setReloadKey((key) => key + 1);
    }
  }

  if (error) return <p className="rounded-md bg-rose-50 p-4 text-rose-700">{error}</p>;
  if (loading || !audit) return <p className="text-slate-500">กำลังโหลดรายละเอียดการตรวจ...</p>;

  const statusBanner = statusBanners[audit.status] || statusBanners.Scheduled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{audit.title}</h1>
        <p className="text-sm text-slate-500">{formatDate(audit.scheduleDate)}</p>
      </div>
      <div className={`rounded-lg border p-5 ${statusBanner.className}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-80">สถานะการตรวจ</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-2xl font-semibold">{statusBanner.label}</p>
              {audit.isOverdue && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                  เกินกำหนด
                </span>
              )}
            </div>
            <p className="mt-2 text-sm opacity-70">{formatDate(audit.scheduleDate)}</p>
          </div>
        </div>
      </div>
      <Card>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
          <Select name="type" defaultValue="NC">
            <option value="NC">NC</option>
            <option value="OFI">OFI</option>
            <option value="OBS">OBS</option>
          </Select>
          <Input name="description" placeholder="รายละเอียดข้อค้นพบ" required />
          <Button disabled={saving}>{saving ? "กำลังบันทึก..." : "เพิ่มข้อค้นพบ"}</Button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold">ข้อค้นพบ</h2>
        <div className="space-y-3">
          {audit.findings.map((finding) => (
            <div key={finding.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{finding.type}</p>
                <StatusBadge status={finding.status} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{finding.description}</p>
              <p className="mt-2 text-xs text-slate-500">รหัสข้อค้นพบ: {finding.id}</p>
            </div>
          ))}
          {audit.findings.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีข้อค้นพบ</p> : null}
        </div>
      </Card>
    </div>
  );
}
