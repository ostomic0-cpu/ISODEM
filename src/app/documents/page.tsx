"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
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

type QueryParams = {
  q: string;
  category: string;
  status: string;
  department: string;
  folderId: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  pageSize: number;
};

const categoryOptions = ["", "SOP", "WI", "Policy", "Form"];
const statusOptions = ["", "Draft", "InReview", "Approved", "Obsolete"];
const sortOptions = [
  { value: "updatedAt", label: "อัปเดตล่าสุด" },
  { value: "createdAt", label: "วันที่สร้าง" },
  { value: "docNumber", label: "เลขที่เอกสาร" },
  { value: "title", label: "ชื่อเอกสาร" },
  { value: "status", label: "สถานะ" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<QueryParams>({
    q: "", category: "", status: "", department: "", folderId: "",
    sortBy: "updatedAt", sortOrder: "desc", page: 1, pageSize: 20,
  });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  async function loadDocuments(params: QueryParams) {
    await Promise.resolve();
    setLoading(true);
    setError("");
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.category) sp.set("category", params.category);
    if (params.status) sp.set("status", params.status);
    if (params.department) sp.set("department", params.department);
    if (params.folderId) sp.set("folderId", params.folderId);
    sp.set("sortBy", params.sortBy);
    sp.set("sortOrder", params.sortOrder);
    sp.set("page", String(params.page));
    sp.set("pageSize", String(params.pageSize));

    const [docRes, folderRes] = await Promise.all([
      fetch(`/api/documents?${sp.toString()}`),
      fetch("/api/folders"),
    ]);
    if (!docRes.ok) { setError("โหลดเอกสารไม่สำเร็จ"); setLoading(false); return; }
    const body = await docRes.json();
    setDocuments(body.documents ?? []);
    setTotal(body.total ?? 0);
    setTotalPages(body.totalPages ?? 0);
    if (folderRes.ok) setFolders(await folderRes.json());
    setLoading(false);
  }

  function updateFilters(partial: Partial<QueryParams>) {
    const next = { ...filters, ...partial, page: "page" in partial ? partial.page! : 1 };
    setFilters(next);
    loadDocuments(next);
  }

  function clearFilters() {
    const cleared: QueryParams = { q: "", category: "", status: "", department: "", folderId: "", sortBy: "updatedAt", sortOrder: "desc", page: 1, pageSize: 20 };
    setFilters(cleared);
    loadDocuments(cleared);
  }

  useEffect(() => {
    async function initialLoad() {
      await Promise.resolve();
      setLoading(true);
      setError("");
      const sp = new URLSearchParams();
      if (filters.q) sp.set("q", filters.q);
      if (filters.category) sp.set("category", filters.category);
      if (filters.status) sp.set("status", filters.status);
      if (filters.department) sp.set("department", filters.department);
      if (filters.folderId) sp.set("folderId", filters.folderId);
      sp.set("sortBy", filters.sortBy);
      sp.set("sortOrder", filters.sortOrder);
      sp.set("page", String(filters.page));
      sp.set("pageSize", String(filters.pageSize));
      const [docRes, folderRes] = await Promise.all([
        fetch(`/api/documents?${sp.toString()}`),
        fetch("/api/folders"),
      ]);
      if (!docRes.ok) { setError("โหลดเอกสารไม่สำเร็จ"); setLoading(false); return; }
      const body = await docRes.json();
      setDocuments(body.documents ?? []);
      setTotal(body.total ?? 0);
      setTotalPages(body.totalPages ?? 0);
      if (folderRes.ok) setFolders(await folderRes.json());
      setLoading(false);
    }
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    loadDocuments(filters);
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
      {/* Filter Bar */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Top row: Search + Toggle + Clear */}
          <div className="flex items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">ค้นหา</label>
              <Input
                placeholder="ค้นหาด้วยเลขที่หรือชื่อเอกสาร..."
                defaultValue={filters.q}
                onChange={(e) => {
                  if (searchTimer.current) clearTimeout(searchTimer.current);
                  searchTimer.current = setTimeout(() => updateFilters({ q: e.target.value }), 300);
                }}
              />
            </div>
            <Button variant="secondary" onClick={() => setFiltersExpanded((v) => !v)} className="shrink-0">
              ตัวกรอง {filtersExpanded ? "▲" : "▼"}
            </Button>
            <Button variant="secondary" onClick={clearFilters} className="shrink-0">ล้าง</Button>
          </div>
          {/* Advanced filters panel */}
          {filtersExpanded ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">ประเภท</label>
                <Select value={filters.category} onChange={(e) => updateFilters({ category: e.target.value })}>
                  {categoryOptions.map((o) => <option key={o} value={o}>{o || "ทั้งหมด"}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">สถานะ</label>
                <Select value={filters.status} onChange={(e) => updateFilters({ status: e.target.value })}>
                  {statusOptions.map((o) => <option key={o} value={o}>{o || "ทั้งหมด"}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">แผนก</label>
                <Input placeholder="แผนก..." value={filters.department} onChange={(e) => updateFilters({ department: e.target.value })} className="w-32" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">โฟลเดอร์</label>
                <Select value={filters.folderId} onChange={(e) => updateFilters({ folderId: e.target.value })}>
                  <option value="">ทั้งหมด</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">จัดเรียง</label>
                <div className="flex gap-1">
                  <Select value={filters.sortBy} onChange={(e) => updateFilters({ sortBy: e.target.value })}>
                    {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  <Button variant="secondary" onClick={() => updateFilters({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}>
                    {filters.sortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
      <Card className="overflow-x-auto">
        {loading ? (
          <p className="text-slate-500">กำลังโหลดเอกสาร...</p>
        ) : (
          <>
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
            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">ทั้งหมด {total} รายการ</p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })}>ก่อนหน้า</Button>
                  <span className="text-sm text-slate-600">หน้า {filters.page} จาก {totalPages}</span>
                  <Button variant="secondary" disabled={filters.page >= totalPages} onClick={() => updateFilters({ page: filters.page + 1 })}>ถัดไป</Button>
                </div>
              </div>
            ) : total > 0 ? (
              <div className="border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">ทั้งหมด {total} รายการ</p>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
