"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { DepartmentDropdown } from "@/components/shared/department-dropdown";
import { formatDate } from "@/lib/utils";

type DepartmentRef = { id: string; name: string };
type Audit = { id: string; title: string; scheduleDate: string; status: string; isOverdue?: boolean; findings: unknown[]; department?: DepartmentRef | null };

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [deptFilter, setDeptFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [departments, setDepartments] = useState<DepartmentRef[]>([]);
  const pageSize = 15;
  const _totalPages = Math.ceil(audits.length / pageSize);
  const filteredAudits = searchQuery
    ? audits.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : audits;
  const paginatedAudits = filteredAudits.slice((page - 1) * pageSize, page * pageSize);
  const filteredTotalPages = Math.ceil(filteredAudits.length / pageSize);

  useEffect(() => {
    async function loadAudits() {
      setLoading(true);
      setPage(1);
      const sp = new URLSearchParams();
      if (deptFilter) sp.set("departmentId", deptFilter);
      const query = sp.toString();
      const [auditRes, deptRes] = await Promise.all([
        fetch(`/api/audits${query ? `?${query}` : ""}`),
        fetch("/api/departments"),
      ]);
      if (!auditRes.ok) setError("โหลดรายการตรวจประเมินไม่สำเร็จ");
      else setAudits(await auditRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
      setLoading(false);
    }

    loadAudits();
  }, [reloadKey, deptFilter]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/audits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setSaving(false);
    if (!response.ok) setError("สร้างแผนตรวจประเมินไม่สำเร็จ");
    else {
      event.currentTarget.reset();
      setReloadKey((key) => key + 1);
      setSuccess("สร้างแผนตรวจประเมินสำเร็จ");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ระบบตรวจประเมิน</h1>
        <p className="text-sm text-slate-500">วางแผน ตรวจติดตาม และบันทึกข้อค้นพบ</p>
      </div>
      <Card>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input name="title" placeholder="หัวข้อการตรวจประเมิน" required />
          <Input name="scheduleDate" type="date" required />
          <Select name="status" defaultValue="Scheduled">
            <option value="Scheduled">วางแผนแล้ว</option>
            <option value="InProgress">กำลังดำเนินการ</option>
            <option value="Completed">เสร็จสิ้น</option>
            <option value="Cancelled">ยกเลิก</option>
          </Select>
          <DepartmentDropdown name="departmentId" placeholder="ไม่ระบุแผนก" />
          <input type="hidden" name="checklistData" value="[]" />
          <Button disabled={saving} className="md:col-span-3">{saving ? "กำลังบันทึก..." : "สร้างแผนตรวจ"}</Button>
        </form>
      </Card>
      {success ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">ค้นหา</label>
              <input
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="ค้นหาด้วยหัวข้อตรวจประเมิน..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="secondary" onClick={() => setFiltersExpanded((v) => !v)} className="shrink-0">
              ตัวกรอง {filtersExpanded ? "▲" : "▼"}
            </Button>
            <Button variant="secondary" onClick={() => { setDeptFilter(""); setSearchQuery(""); setPage(1); }} className="shrink-0">ล้าง</Button>
          </div>
          {filtersExpanded ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">แผนก</label>
                <div className="w-40">
                  <DepartmentDropdown
                    value={deptFilter}
                    onChange={(v) => setDeptFilter(v)}
                    departments={departments}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
      <Card className="overflow-x-auto">
        {loading ? <p className="text-slate-500">กำลังโหลดรายการตรวจประเมิน...</p> : filteredAudits.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">ไม่พบรายการตรวจประเมิน</p>
        ) : (
          <>
            <Table>
              <thead><tr><Th>หัวข้อ</Th><Th>วันที่</Th><Th>สถานะ</Th><Th>ข้อค้นพบ</Th><Th>แผนก</Th></tr></thead>
              <tbody>
                {paginatedAudits.map((audit) => (
                  <tr key={audit.id}>
                    <Td className="max-w-[200px] truncate"><Link className="font-medium text-teal-700" href={`/audits/${audit.id}`}>{audit.title}</Link></Td>
                    <Td>{formatDate(audit.scheduleDate)}</Td>
                    <Td>
                      <StatusBadge status={audit.status} />
                      {audit.isOverdue && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                          เกินกำหนด
                        </span>
                      )}
                    </Td>
                    <Td>{audit.findings.length}</Td>
                    <Td>{audit.department?.name || "ไม่ระบุแผนก"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {filteredTotalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">ทั้งหมด {filteredAudits.length} รายการ</p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
                  <span className="text-sm text-slate-600">หน้า {page} / {filteredTotalPages}</span>
                  <Button variant="secondary" disabled={page >= filteredTotalPages} onClick={() => setPage(page + 1)}>ถัดไป</Button>
                </div>
              </div>
            ) : filteredAudits.length > 0 ? (
              <div className="border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">ทั้งหมด {filteredAudits.length} รายการ</p>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
