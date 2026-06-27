"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  name: string;
  department: string;
  role: { name: string };
  isActive: boolean;
  createdAt: string;
};

type ModalMode = "create" | "edit" | "password" | null;

const roleOptions = ["Admin", "QA", "Engineer"];

export function UsersClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  async function loadUsers() {
    setLoading(true);
    const response = await fetch("/api/admin/users");
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "โหลดผู้ใช้ไม่สำเร็จ");
      setLoading(false);
      return;
    }
    setUsers(await response.json());
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/users")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          setError(body?.error ?? "โหลดผู้ใช้ไม่สำเร็จ");
          setLoading(false);
          return;
        }
        setUsers(await response.json());
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("โหลดผู้ใช้ไม่สำเร็จ");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function openModal(mode: ModalMode, user: UserRow | null = null) {
    setError("");
    setSelectedUser(user);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitJson("/api/admin/users", "POST", {
      email: String(form.get("email") ?? ""),
      name: String(form.get("name") ?? ""),
      department: String(form.get("department") ?? ""),
      role: String(form.get("role") ?? ""),
      password: String(form.get("password") ?? ""),
    });
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;
    const form = new FormData(event.currentTarget);
    await submitJson(`/api/admin/users/${selectedUser.id}`, "PATCH", {
      name: String(form.get("name") ?? ""),
      department: String(form.get("department") ?? ""),
      role: String(form.get("role") ?? ""),
    });
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;
    const form = new FormData(event.currentTarget);
    await submitJson(`/api/admin/users/${selectedUser.id}`, "PATCH", {
      password: String(form.get("password") ?? ""),
    });
  }

  async function toggleActive(user: UserRow) {
    if (user.id === currentUserId && user.isActive) {
      setError("ไม่สามารถปิดใช้งานบัญชีตัวเองได้");
      return;
    }
    if (user.isActive) {
      await submitJson(`/api/admin/users/${user.id}`, "DELETE", null);
      return;
    }
    await submitJson(`/api/admin/users/${user.id}`, "PATCH", { isActive: true });
  }

  async function submitJson(url: string, method: string, payload: Record<string, unknown> | null) {
    setSaving(true);
    setError("");
    const response = await fetch(url, {
      method,
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    setSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "บันทึกข้อมูลไม่สำเร็จ");
      return;
    }

    closeModal();
    await loadUsers();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">จัดการผู้ใช้</h1>
          <p className="text-sm text-slate-500">เพิ่ม แก้ไข และปิดใช้งานบัญชีผู้ใช้</p>
        </div>
        <Button onClick={() => openModal("create")}>สร้างผู้ใช้</Button>
      </div>

      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <Card className="overflow-x-auto">
        {loading ? (
          <p className="text-slate-500">กำลังโหลดผู้ใช้...</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>อีเมล</Th>
                <Th>ชื่อ</Th>
                <Th>แผนก</Th>
                <Th>บทบาท</Th>
                <Th>สถานะ</Th>
                <Th>วันที่สร้าง</Th>
                <Th>จัดการ</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <Td>{user.email}</Td>
                  <Td>{user.name}</Td>
                  <Td>{user.department}</Td>
                  <Td>{user.role.name}</Td>
                  <Td>
                    <span
                      className={
                        user.isActive
                          ? "[&>span]:bg-emerald-50 [&>span]:text-emerald-700"
                          : "[&>span]:bg-slate-100 [&>span]:text-slate-500"
                      }
                    >
                      <StatusBadge status={user.isActive ? "Active" : "Disabled"} />
                    </span>
                  </Td>
                  <Td>{formatDate(user.createdAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openModal("edit", user)}>
                        แก้ไข
                      </Button>
                      <Button variant="secondary" onClick={() => openModal("password", user)}>
                        รีเซ็ตรหัสผ่าน
                      </Button>
                      <Button
                        variant={user.isActive ? "danger" : "secondary"}
                        onClick={() => toggleActive(user)}
                        disabled={saving || (user.id === currentUserId && user.isActive)}
                      >
                        {user.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {modalMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
          <div className="w-full max-w-lg">
            {modalMode === "create" ? (
              <Dialog title="สร้างผู้ใช้">
                <UserForm onSubmit={submitCreate} saving={saving} onCancel={closeModal} />
              </Dialog>
            ) : null}
            {modalMode === "edit" && selectedUser ? (
              <Dialog title="แก้ไขผู้ใช้">
                <UserForm
                  user={selectedUser}
                  onSubmit={submitEdit}
                  saving={saving}
                  onCancel={closeModal}
                  hideEmail
                  hidePassword
                />
              </Dialog>
            ) : null}
            {modalMode === "password" && selectedUser ? (
              <Dialog title="รีเซ็ตรหัสผ่าน">
                <form onSubmit={submitPassword} className="space-y-4">
                  <label className="block text-sm font-medium">
                    รหัสผ่านใหม่
                    <Input className="mt-1" name="password" type="password" required />
                  </label>
                  <FormActions saving={saving} onCancel={closeModal} />
                </form>
              </Dialog>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UserForm({
  user,
  onSubmit,
  saving,
  onCancel,
  hideEmail = false,
  hidePassword = false,
}: {
  user?: UserRow;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  onCancel: () => void;
  hideEmail?: boolean;
  hidePassword?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {hideEmail ? null : (
        <label className="block text-sm font-medium">
          อีเมล
          <Input className="mt-1" name="email" type="email" defaultValue={user?.email ?? ""} required />
        </label>
      )}
      <label className="block text-sm font-medium">
        ชื่อ
        <Input className="mt-1" name="name" defaultValue={user?.name ?? ""} required />
      </label>
      <label className="block text-sm font-medium">
        แผนก
        <Input className="mt-1" name="department" defaultValue={user?.department ?? ""} required />
      </label>
      <label className="block text-sm font-medium">
        บทบาท
        <Select className="mt-1" name="role" defaultValue={user?.role.name ?? "Engineer"}>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
      </label>
      {hidePassword ? null : (
        <label className="block text-sm font-medium">
          รหัสผ่าน
          <Input className="mt-1" name="password" type="password" required />
        </label>
      )}
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  );
}

function FormActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="secondary" onClick={onCancel}>
        ยกเลิก
      </Button>
      <Button disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
    </div>
  );
}
