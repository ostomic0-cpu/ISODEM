"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Folder = { id: string; name: string; parentId: string | null; _count?: { documents: number } };

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadFolders() {
      setLoading(true);
      const response = await fetch("/api/folders");
      if (!response.ok) setError("โหลดโฟลเดอร์ไม่สำเร็จ");
      else setFolders(await response.json());
      setLoading(false);
    }

    loadFolders();
  }, [reloadKey]);

  async function createFolder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });
    setSaving(false);
    if (!response.ok) {
      setError("บันทึกโฟลเดอร์ไม่สำเร็จ");
      return;
    }
    setName("");
    setParentId("");
    setReloadKey((key) => key + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">จัดการโฟลเดอร์</h1>
        <p className="text-sm text-slate-500">สร้างโครงสร้างแฟ้มเอกสาร</p>
      </div>
      <Card>
        <form onSubmit={createFolder} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="ชื่อโฟลเดอร์" value={name} onChange={(event) => setName(event.target.value)} required />
          <Select value={parentId} onChange={(event) => setParentId(event.target.value)}>
            <option value="">ไม่มีโฟลเดอร์แม่</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </Select>
          <Button disabled={saving}>{saving ? "กำลังบันทึก..." : "เพิ่มโฟลเดอร์"}</Button>
        </form>
      </Card>
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <Card>
        {loading ? (
          <p className="text-slate-500">กำลังโหลดโฟลเดอร์...</p>
        ) : (
          <div className="space-y-2">
            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <div>
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-xs text-slate-500">เอกสาร {folder._count?.documents ?? 0} รายการ</p>
                </div>
                <span className="text-xs text-slate-500">{folder.parentId ? "โฟลเดอร์ย่อย" : "โฟลเดอร์หลัก"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
