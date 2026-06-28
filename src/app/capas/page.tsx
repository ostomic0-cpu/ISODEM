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
type Capa = { id: string; status: string; targetDate: string; isOverdue?: boolean; finding: { description: string } };

export default function CapasPage() {
  const [capas, setCapas] = useState<Capa[]>([]);
  const [findings, setFindings] = useState<FindingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.ceil(capas.length / pageSize);
  const paginatedCapas = capas.slice((page - 1) * pageSize, page * pageSize);

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

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

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
      setSuccess("สร้าง CAPA สำเร็จ");
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
      {success ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <Card className="overflow-x-auto">
        {loading ? <p className="text-slate-500">กำลังโหลด CAPA...</p> : (
          <>
            <Table>
              <thead><tr><Th>ข้อค้นพบ</Th><Th>กำหนดเสร็จ</Th><Th>สถานะ</Th></tr></thead>
              <tbody>
                {paginatedCapas.map((capa) => (
                  <tr key={capa.id}>
                    <Td className="max-w-[200px] truncate"><Link className="font-medium text-teal-700" href={`/capas/${capa.id}`}>{capa.finding.description}</Link></Td>
                    <Td>{formatDate(capa.targetDate)}</Td>
                    <Td>
                      <StatusBadge status={capa.status} />
                      {capa.isOverdue && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                          เกินกำหนด
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">ทั้งหมด {capas.length} รายการ</p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
                  <span className="text-sm text-slate-600">หน้า {page} / {totalPages}</span>
                  <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>ถัดไป</Button>
                </div>
              </div>
            ) : capas.length > 0 ? (
              <div className="border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">ทั้งหมด {capas.length} รายการ</p>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
