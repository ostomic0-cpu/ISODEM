"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";

type Department = {
  id: string;
  name: string;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  children?: Department[];
  _count?: { children: number; audits: number; capas: number; documents: number };
};

function buildTree(flat: Department[]): Department[] {
  const map = new Map<string, Department>();
  for (const d of flat) map.set(d.id, { ...d, children: [] });
  const roots: Department[] = [];
  for (const d of flat) {
    if (d.parentId && map.has(d.parentId)) {
      map.get(d.parentId)!.children!.push(map.get(d.id)!);
    } else if (!d.parentId) {
      roots.push(map.get(d.id)!);
    }
  }
  return roots;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [formName, setFormName] = useState("");
  const [formParentId, setFormParentId] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/departments");
        if (res.ok) setDepartments(await res.json());
        else setError("โหลดแผนกไม่สำเร็จ");
      } catch {
        setError("โหลดแผนกไม่สำเร็จ");
      }
      setLoading(false);
    }
    load();
  }, [reloadKey]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  function openCreate() {
    setEditDept(null);
    setFormName("");
    setFormParentId("");
    setError("");
    setModalOpen(true);
  }

  function openEdit(dept: Department) {
    setEditDept(dept);
    setFormName(dept.name);
    setFormParentId(dept.parentId ?? "");
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditDept(null);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = { name: formName };
    if (formParentId) body.parentId = formParentId;
    else body.parentId = null;

    const method = editDept ? "PATCH" : "POST";
    const url = editDept ? `/api/departments/${editDept.id}` : "/api/departments";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    closeModal();
    setReloadKey((k) => k + 1);
    setSuccess(editDept ? "แก้ไขแผนกสำเร็จ" : "สร้างแผนกสำเร็จ");
  }

  async function handleDelete(dept: Department) {
    if (!confirm(`ยืนยันลบแผนก "${dept.name}"?`)) return;
    const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "ลบแผนกไม่สำเร็จ");
      return;
    }
    setReloadKey((k) => k + 1);
    setSuccess(`ลบแผนก "${dept.name}" สำเร็จ`);
  }

  function renderDeptRows(nodes: Department[], depth = 0): React.ReactNode[] {
    const rows: React.ReactNode[] = [];
    for (const node of nodes) {
      const childCount = node._count?.children ?? node.children?.length ?? 0;
      rows.push(
        <tr key={node.id}>
          <Td>
            <span style={{ marginLeft: depth * 24 }} className={depth > 0 ? "text-sm text-slate-600" : "font-medium"}>
              {depth > 0 ? "└ " : ""}{node.name}
            </span>
          </Td>
          <Td className="text-slate-500">{node._count?.children ?? 0}</Td>
          <Td>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => openEdit(node)}>แก้ไข</Button>
              {childCount > 0 ? (
                <Button variant="secondary" disabled title="ไม่สามารถลบแผนกที่มีแผนกย่อย">ลบ</Button>
              ) : (
                <Button variant="danger" onClick={() => handleDelete(node)}>ลบ</Button>
              )}
            </div>
          </Td>
        </tr>
      );
      if (node.children) rows.push(...renderDeptRows(node.children, depth + 1));
    }
    return rows;
  }

  const tree = buildTree(departments);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">จัดการแผนก</h1>
          <p className="text-sm text-slate-500">สร้าง แก้ไข และลบแผนกขององค์กร</p>
        </div>
        <Button onClick={openCreate}>+ สร้างแผนก</Button>
      </div>
      {success ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
      {error && !modalOpen ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <Card className="overflow-x-auto">
        {loading ? <p className="text-slate-500">กำลังโหลดแผนก...</p> : departments.length === 0 ? (
          <p className="text-slate-500">ยังไม่มีแผนก กรุณาสร้างแผนกแรก</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>ชื่อแผนก</Th>
                <Th>แผนกย่อย</Th>
                <Th>จัดการ</Th>
              </tr>
            </thead>
            <tbody>{renderDeptRows(tree)}</tbody>
          </Table>
        )}
      </Card>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-base font-semibold">{editDept ? "แก้ไขแผนก" : "สร้างแผนกใหม่"}</h2>
            <form onSubmit={handleSave} className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">ชื่อแผนก</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ชื่อแผนก"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">แผนกหลัก</label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">ไม่มี (แผนกหลัก)</option>
                  {departments
                    .filter((d) => editDept ? d.id !== editDept.id : true)
                    .map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </div>
              {error ? <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "กำลังบันทึก..." : editDept ? "บันทึกการแก้ไข" : "สร้างแผนก"}
                </Button>
                <Button variant="secondary" onClick={closeModal} type="button">ยกเลิก</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
