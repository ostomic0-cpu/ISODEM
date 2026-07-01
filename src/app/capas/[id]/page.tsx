"use client";

import { use, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DepartmentDropdown } from "@/components/shared/department-dropdown";
import { formatDate, priorityLabels, priorityColors } from "@/lib/utils";

type DepartmentRef = { id: string; name: string };
type Capa = { id: string; capaNumber?: string | null; rcaNotes: string; actionPlan: string; verificationNotes?: string | null; status: string; targetDate: string; isOverdue?: boolean; priority: string; dueDate?: string | null; assignee?: { id: string; name: string } | null; finding: { description: string }; department?: DepartmentRef | null };

export default function CapaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [capa, setCapa] = useState<Capa | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadCapa() {
      setLoading(true);
      const [response, usersResponse] = await Promise.all([fetch(`/api/capas/${id}`), fetch("/api/users")]);
      if (!response.ok) setError("โหลดรายละเอียด CAPA ไม่สำเร็จ");
      else setCapa(await response.json());
      if (usersResponse.ok) setUsers(await usersResponse.json());
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
        <h1 className="text-2xl font-semibold">
          {capa.capaNumber ? (
            <><span className="text-slate-400">{capa.capaNumber}</span> — </>
          ) : null}
          รายละเอียด CAPA
        </h1>
        <p className="text-sm text-slate-500">{capa.finding.description}</p>
        {capa.department?.name ? (
          <p className="mt-1 text-xs text-slate-500">แผนก: {capa.department.name}</p>
        ) : null}
      </div>
      <Card>
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColors[capa.priority] ?? priorityColors.MEDIUM}`}>
              {priorityLabels[capa.priority] ?? capa.priority}
            </span>
            <p className="text-sm text-slate-500">กำหนดเสร็จ {formatDate(capa.targetDate)}</p>
            {capa.dueDate ? (
              <p className="text-sm text-slate-500">ครบกำหนด {formatDate(capa.dueDate)}</p>
            ) : null}
            {capa.isOverdue && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                เกินกำหนด
              </span>
            )}
            <StatusBadge status={capa.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {capa.assignee?.name ? (
              <span>ผู้รับผิดชอบ: {capa.assignee.name}</span>
            ) : (
              <span>ผู้รับผิดชอบ: ไม่กำหนด</span>
            )}
            {capa.department?.name ? (
              <span>แผนก: {capa.department.name}</span>
            ) : null}
          </div>
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
          <Select name="priority" defaultValue={capa.priority}>
            <option value="LOW">ต่ำ</option>
            <option value="MEDIUM">ปานกลาง</option>
            <option value="HIGH">สูง</option>
            <option value="CRITICAL">วิกฤต</option>
          </Select>
          <Select name="assigneeId" defaultValue={capa.assignee?.id ?? ""}>
            <option value="">ไม่กำหนดผู้รับผิดชอบ</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </Select>
          <DepartmentDropdown name="departmentId" defaultValue={capa.department?.id ?? ""} placeholder="ไม่ระบุแผนก" />
          <Input name="dueDate" type="date" defaultValue={capa.dueDate ? capa.dueDate.slice(0, 10) : ""} placeholder="วันครบกำหนด" />
          <Button className="md:col-span-2" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</Button>
        </form>
      </Card>
    </div>
  );
}
