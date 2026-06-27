"use client";

import { use, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

type Capa = { id: string; rcaNotes: string; actionPlan: string; verificationNotes?: string | null; status: string; targetDate: string; finding: { description: string } };

export default function CapaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [capa, setCapa] = useState<Capa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadCapa() {
      setLoading(true);
      const response = await fetch(`/api/capas/${id}`);
      if (!response.ok) setError("โหลดรายละเอียด CAPA ไม่สำเร็จ");
      else setCapa(await response.json());
      setLoading(false);
    }

    loadCapa();
  }, [id, reloadKey]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(`/api/capas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    setSaving(false);
    if (!response.ok) setError("อัปเดต CAPA ไม่สำเร็จ");
    else setReloadKey((key) => key + 1);
  }

  if (error) return <p className="rounded-md bg-rose-50 p-4 text-rose-700">{error}</p>;
  if (loading || !capa) return <p className="text-slate-500">กำลังโหลดรายละเอียด CAPA...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">รายละเอียด CAPA</h1>
        <p className="text-sm text-slate-500">{capa.finding.description}</p>
      </div>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">กำหนดเสร็จ {formatDate(capa.targetDate)}</p>
          <StatusBadge status={capa.status} />
        </div>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <Input name="rcaNotes" defaultValue={capa.rcaNotes} placeholder="บันทึก RCA" />
          <Input name="actionPlan" defaultValue={capa.actionPlan} placeholder="แผนปฏิบัติการ" />
          <Input name="verificationNotes" defaultValue={capa.verificationNotes ?? ""} placeholder="ผลการตรวจยืนยัน" />
          <Select name="status" defaultValue={capa.status}>
            <option value="Open">เปิด</option>
            <option value="VerificationPending">รอตรวจยืนยัน</option>
            <option value="Closed">ปิดแล้ว</option>
          </Select>
          <Button className="md:col-span-2" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</Button>
        </form>
      </Card>
    </div>
  );
}
