"use client";

import { use, useEffect, useState } from "react";
import { FileUploader } from "@/components/shared/file-uploader";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

type DocumentDetail = {
  id: string;
  docNumber: string;
  title: string;
  status: string;
  versions: Array<{ id: string; versionNumber: string; originalFilename: string; filePath: string; status: string; createdAt: string; changeSummary: string }>;
};

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function loadDocument() {
      setLoading(true);
      const response = await fetch(`/api/documents/${id}`);
      if (!response.ok) setError("โหลดรายละเอียดเอกสารไม่สำเร็จ");
      else setDocument(await response.json());
      setLoading(false);
    }

    loadDocument();
  }, [id, reloadKey]);

  async function addVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    const response = await fetch(`/api/documents/${id}`, { method: "POST", body: new FormData(form) });
    setSaving(false);
    if (!response.ok) setError("เพิ่มเวอร์ชันไม่สำเร็จ");
    else {
      form.reset();
      setReloadKey((key) => key + 1);
    }
  }

  if (error) return <p className="rounded-md bg-rose-50 p-4 text-rose-700">{error}</p>;
  if (loading || !document) return <p className="text-slate-500">กำลังโหลดรายละเอียดเอกสาร...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{document.title}</h1>
        <p className="text-sm text-slate-500">{document.docNumber}</p>
      </div>
      <Card>
        <form onSubmit={addVersion} className="grid gap-3 md:grid-cols-2">
          <Input name="versionNumber" placeholder="เลขเวอร์ชัน" required />
          <Input name="changeSummary" placeholder="สรุปการเปลี่ยนแปลง" required />
          <div className="md:col-span-2"><FileUploader /></div>
          <Button disabled={saving} className="md:col-span-2">{saving ? "กำลังอัปโหลด..." : "เพิ่มเวอร์ชัน"}</Button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold">ประวัติเวอร์ชัน</h2>
        <div className="space-y-3">
          {document.versions.map((version) => (
            <div key={version.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <a className="font-medium text-teal-700" href={version.filePath} target="_blank">
                  เวอร์ชัน {version.versionNumber}
                </a>
                <StatusBadge status={version.status} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{version.changeSummary}</p>
              <p className="mt-1 text-xs text-slate-500">{version.originalFilename} · {formatDate(version.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
