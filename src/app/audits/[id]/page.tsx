"use client";

import { use, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, severityLabels, severityColors } from "@/lib/utils";

type DepartmentRef = { id: string; name: string };
type Finding = { id: string; type: string; severity: string; description: string; status: string; capa?: { id: string } | null };
type AuditDetail = { id: string; title: string; scheduleDate: string; status: string; isOverdue?: boolean; findings: Finding[]; department?: DepartmentRef | null };

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
  const [changingStatus, setChangingStatus] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.resolve(null)))
      .then((s) => setUserRole(s?.role ?? null))
      .finally(() => setRoleChecked(true));
  }, []);

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

  async function changeStatus(newStatus: string) {
    setChangingStatus(true);
    const response = await fetch(`/api/audits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setChangingStatus(false);
    if (!response.ok) setError("เปลี่ยนสถานะไม่สำเร็จ");
    else setReloadKey((key) => key + 1);
  }

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
            {roleChecked && userRole && ["Admin", "QA"].includes(userRole) ? (
              <div className="mt-3 flex items-center gap-2">
                <select
                  value={audit.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  disabled={changingStatus}
                  className="flex h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Scheduled">วางแผนแล้ว</option>
                  <option value="InProgress">กำลังดำเนินการ</option>
                  <option value="Completed">เสร็จสิ้น</option>
                  <option value="Cancelled">ยกเลิก</option>
                </select>
                {changingStatus ? <span className="text-sm text-slate-500">กำลังเปลี่ยนสถานะ...</span> : null}
              </div>
            ) : null}
            <p className="mt-2 text-sm opacity-70">{formatDate(audit.scheduleDate)}</p>
            {audit.department?.name ? (
              <p className="mt-1 text-sm opacity-70">แผนก: {audit.department.name}</p>
            ) : null}
          </div>
        </div>
      </div>
      <Card>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[120px_140px_1fr_auto]">
          <Select name="type" defaultValue="NC">
            <option value="NC">NC</option>
            <option value="OFI">OFI</option>
            <option value="OBS">OBS</option>
          </Select>
          <div>
            <Select name="severity" defaultValue="OBS">
              <option value="OBS">ข้อสังเกต</option>
              <option value="OFI">โอกาสพัฒนา</option>
              <option value="MINOR">บกพร่องเล็กน้อย</option>
              <option value="MAJOR">บกพร่องรุนแรง</option>
              <option value="CAR">ต้องแก้ไข</option>
            </Select>
            <details className="mt-1 text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-teal-600">ⓘ อธิบายระดับ</summary>
              <div className="mt-1 space-y-0.5 rounded bg-slate-50 p-2 leading-relaxed">
                <p><b>OBS</b> = ข้อสังเกต (Observation)</p>
                <p><b>OFI</b> = โอกาสพัฒนา (Opportunity for Improvement)</p>
                <p><b>MINOR</b> = ข้อบกพร่องเล็กน้อย (Minor Nonconformity)</p>
                <p><b>MAJOR</b> = ข้อบกพร่องรุนแรง (Major Nonconformity)</p>
                <p><b>CAR</b> = ต้องแก้ไข (Corrective Action Request)</p>
              </div>
            </details>
          </div>
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
                <div className="flex items-center gap-2">
                  <p className="font-medium">{finding.type}</p>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityColors[finding.severity] ?? severityColors.OBS}`}>
                    {severityLabels[finding.severity] ?? finding.severity}
                  </span>
                </div>
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
