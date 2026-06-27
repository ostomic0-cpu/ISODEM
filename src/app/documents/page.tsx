"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileUploader } from "@/components/shared/file-uploader";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";

type Folder = { id: string; name: string };
type DocumentRow = {
  id: string;
  docNumber: string;
  title: string;
  category: string;
  status: string;
  department: string;
  folder: Folder;
};
type CurrentUser = { role: string };

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true);
      const [documentResponse, folderResponse] = await Promise.all([fetch("/api/documents"), fetch("/api/folders")]);
      if (!documentResponse.ok) setError("โหลดเอกสารไม่สำเร็จ");
      else setDocuments(await documentResponse.json());
      if (folderResponse.ok) setFolders(await folderResponse.json());
      setLoading(false);
    }

    loadDocuments();
  }, [reloadKey]);

  useEffect(() => {
    async function loadCurrentUser() {
      const response = await fetch("/api/auth/me");
      if (!response.ok) return;
      const user = (await response.json()) as CurrentUser;
      setUserRole(user.role);
    }

    loadCurrentUser();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError("");
    const response = await fetch("/api/documents", { method: "POST", body: new FormData(form) });
    setSaving(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "บันทึกเอกสารไม่สำเร็จ");
      return;
    }
    form.reset();
    setReloadKey((key) => key + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ควบคุมเอกสาร</h1>
        <p className="text-sm text-slate-500">สร้างเอกสารและจัดเก็บไฟล์เวอร์ชันแรก</p>
      </div>
      <Card>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          {userRole === "Admin" || userRole === "QA" ? (
            <Input name="docNumber" placeholder="SOP-2026-001 (เว้นว่างให้ระบบสร้างให้)" />
          ) : (
            <p className="flex h-10 items-center rounded-md border border-dashed border-slate-300 px-3 text-sm text-slate-500">
              ระบบจะสร้างเลขที่เอกสารอัตโนมัติ
            </p>
          )}
          <Input name="title" placeholder="ชื่อเอกสาร" required />
          <Select name="category" defaultValue="SOP">
            <option value="SOP">SOP</option>
            <option value="WI">WI</option>
            <option value="Policy">Policy</option>
            <option value="Form">Form</option>
          </Select>
          <Select name="status" defaultValue="Draft">
            <option value="Draft">ฉบับร่าง</option>
            <option value="Review">รอตรวจทาน</option>
            <option value="Approved">อนุมัติแล้ว</option>
            <option value="Archived">เก็บถาวร</option>
          </Select>
          <Input name="department" placeholder="แผนก" required />
          <Select name="folderId" defaultValue={folders[0]?.id ?? "root-folder"}>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </Select>
          <Input name="versionNumber" placeholder="เวอร์ชัน เช่น 1.0" defaultValue="1.0" />
          <Input name="changeSummary" placeholder="สรุปการเปลี่ยนแปลง" defaultValue="สร้างเอกสารใหม่" />
          <div className="md:col-span-2">
            <FileUploader />
          </div>
          <Button className="md:col-span-2" disabled={saving}>{saving ? "กำลังบันทึก..." : "สร้างเอกสาร"}</Button>
        </form>
      </Card>
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <Card className="overflow-x-auto">
        {loading ? (
          <p className="text-slate-500">กำลังโหลดเอกสาร...</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>เลขที่</Th>
                <Th>ชื่อเอกสาร</Th>
                <Th>ประเภท</Th>
                <Th>สถานะ</Th>
                <Th>แผนก</Th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <Td>{document.docNumber}</Td>
                  <Td><Link className="font-medium text-teal-700" href={`/documents/${document.id}`}>{document.title}</Link></Td>
                  <Td>{document.category}</Td>
                  <Td><StatusBadge status={document.status} /></Td>
                  <Td>{document.department}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
