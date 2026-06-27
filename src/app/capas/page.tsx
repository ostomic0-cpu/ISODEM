"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type FindingOption = { id: string; description: string; capa?: unknown };
type Audit = { findings: FindingOption[] };
type Capa = { id: string; status: string; targetDate: string; finding: { description: string } };

export default function CapasPage() {
  const [capas, setCapas] = useState<Capa[]>([]);
  const [findings, setFindings] = useState<FindingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadCapas() {
      setLoading(true);
      const [capaResponse, auditResponse] = await Promise.all([fetch("/api/capas"), fetch("/api/audits")]);
      if (!capaResponse.ok) setError("โหลด CAPA ไม่สำเร็จ");
      else setCapas(await capaResponse.json());
      if (auditResponse.ok) {
        const audits: Audit[] = await auditResponse.json();
        setFindings(audits.flatMap((audit) => audit.findings).filter((finding) => !finding.capa));
      }
      setLoading(false);
    }

    loadCapas();
  }, [reloadKey]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/capas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    setSaving(false);
    if (!response.ok) setError("สร้าง CAPA ไม่สำเร็จ");
    else {
      event.currentTarget.reset();
      setReloadKey((key) => key + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">CAPA</h1>
        <p className="text-sm text-slate-500">วิเคราะห์สาเหตุ กำหนดแผนแก้ไข และตรวจยืนยันผล</p>
      </div>
      <Card>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <Select name="findingId" required>
            <option value="">เลือกข้อค้นพบ</option>
            {findings.map((finding) => (
              <option key={finding.id} value={finding.id}>{finding.description}</option>
            ))}
          </Select>
          <Input name="targetDate" type="date" required />
          <Input name="rcaNotes" placeholder="บันทึก RCA" required />
          <Input name="actionPlan" placeholder="แผนปฏิบัติการ" required />
          <Button className="md:col-span-2" disabled={saving}>{saving ? "กำลังบันทึก..." : "สร้าง CAPA"}</Button>
        </form>
      </Card>
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <Card className="overflow-x-auto">
        {loading ? <p className="text-slate-500">กำลังโหลด CAPA...</p> : (
          <Table>
            <thead><tr><Th>ข้อค้นพบ</Th><Th>กำหนดเสร็จ</Th><Th>สถานะ</Th></tr></thead>
            <tbody>
              {capas.map((capa) => (
                <tr key={capa.id}>
                  <Td><Link className="font-medium text-teal-700" href={`/capas/${capa.id}`}>{capa.finding.description}</Link></Td>
                  <Td>{formatDate(capa.targetDate)}</Td>
                  <Td><StatusBadge status={capa.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
