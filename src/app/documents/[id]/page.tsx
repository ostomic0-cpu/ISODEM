"use client";

import { use, useEffect, useState } from "react";
import { FileUploader } from "@/components/shared/file-uploader";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, thaiStatus } from "@/lib/utils";

type UserSummary = {
  id: string;
  email: string;
  name: string | null;
  department?: string | null;
  role?: string;
  roleId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Folder = {
  id: string;
  name: string;
};

type DocumentVersion = {
  id: string;
  versionNumber: string;
  originalFilename: string;
  filePath: string;
  status: string;
  createdAt: string;
  changeSummary: string;
  submittedBy?: UserSummary | null;
  approvedBy?: UserSummary | null;
};

type DocumentDetail = {
  id: string;
  docNumber: string;
  title: string;
  status: string;
  category: string;
  department: string;
  folderId: string | null;
  ownerId: string;
  rejectReason: string | null;
  approvalDate: string | null;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
  versions: DocumentVersion[];
  folder: Folder | null;
  owner: UserSummary | null;
};

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

type StatusBanner = {
  label: string;
  className: string;
};

const statusBanners: Record<string, StatusBanner> = {
  Draft: {
    label: "ฉบับร่าง",
    className: "border-slate-200 bg-slate-50 text-slate-800",
  },
  InReview: {
    label: "กำลังตรวจทาน",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  Approved: {
    label: "อนุมัติแล้ว",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  Obsolete: {
    label: "ล้าสมัย",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
};

const lockedStatuses = new Set(["Approved", "Obsolete"]);

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setLoadError("");
      setMessageError("");

      const [documentResponse, userResponse] = await Promise.all([
        fetch(`/api/documents/${id}`),
        fetch("/api/auth/me"),
      ]);

      if (!active) return;

      if (!documentResponse.ok) {
        const body = await documentResponse.json().catch(() => null);
        setLoadError(body?.error ?? "โหลดรายละเอียดเอกสารไม่สำเร็จ");
        setDocument(null);
        setLoading(false);
        return;
      }

      setDocument((await documentResponse.json()) as DocumentDetail);
      if (userResponse.ok) setCurrentUser((await userResponse.json()) as CurrentUser);
      else setCurrentUser(null);
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    if (!messageError) return;
    const timer = setTimeout(() => setMessageError(""), 5000);
    return () => clearTimeout(timer);
  }, [messageError]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  async function readError(response: Response) {
    const body = await response.json().catch(() => null);
    return body?.error ?? "เกิดข้อผิดพลาด";
  }

  function completeAction(message: string) {
    setSuccess(message);
    setRejectOpen(false);
    setRejectReason("");
    setReloadKey((key) => key + 1);
  }

  async function runWorkflowAction(action: "submit-review" | "approve" | "obsolete", message: string) {
    setActionLoading(action);
    setMessageError("");
    setSuccess("");

    const response = await fetch(`/api/documents/${id}/${action}`, { method: "POST" });
    setActionLoading("");

    if (!response.ok) {
      setMessageError(await readError(response));
      return;
    }

    completeAction(message);
  }

  async function rejectDocument() {
    const reason = rejectReason.trim();
    if (!reason) {
      setMessageError("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    setRejectLoading(true);
    setMessageError("");
    setSuccess("");

    const response = await fetch(`/api/documents/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setRejectLoading(false);

    if (!response.ok) {
      setMessageError(await readError(response));
      return;
    }

    completeAction("ปฏิเสธเอกสารแล้ว");
  }

  async function addVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setMessageError("");
    setSuccess("");

    const response = await fetch(`/api/documents/${id}`, { method: "POST", body: new FormData(form) });
    setSaving(false);

    if (!response.ok) {
      setMessageError(await readError(response));
      return;
    }

    form.reset();
    setSuccess("เพิ่มเวอร์ชันแล้ว");
    setReloadKey((key) => key + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" />
        <span>กำลังโหลดรายละเอียดเอกสาร...</span>
      </div>
    );
  }

  if (loadError || !document) {
    return <p className="rounded-md bg-rose-50 p-4 text-rose-700">{loadError || "ไม่พบเอกสาร"}</p>;
  }

  const banner = statusBanners[document.status] ?? {
    label: thaiStatus(document.status),
    className: "border-slate-200 bg-slate-50 text-slate-800",
  };
  const isAdmin = currentUser?.role === "Admin";
  const isQa = currentUser?.role === "QA";
  const isOwner = currentUser?.id === document.ownerId;
  const isLocked = lockedStatuses.has(document.status);
  const canSubmitReview = document.status === "Draft" && (isOwner || isAdmin || isQa);
  const canReview = document.status === "InReview" && (isAdmin || isQa);
  const canObsolete = document.status === "Approved" && isAdmin;

  const metadata = [
    { label: "เลขที่เอกสาร", value: document.docNumber },
    { label: "ชื่อเอกสาร", value: document.title, lockable: true },
    { label: "ประเภท", value: document.category, lockable: true },
    { label: "แผนก", value: document.department, lockable: true },
    { label: "โฟลเดอร์", value: document.folder?.name ?? document.folderId ?? "-" },
    { label: "เจ้าของ", value: document.owner?.name ?? document.owner?.email ?? document.ownerId },
    { label: "วันที่สร้าง", value: formatDate(document.createdAt) },
    ...(document.approvalDate ? [{ label: "วันที่อนุมัติ", value: formatDate(document.approvalDate) }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{document.title}</h1>
        <p className="text-sm text-slate-500">{document.docNumber}</p>
      </div>

      <div className={`rounded-lg border p-5 ${banner.className}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium opacity-80">สถานะเอกสาร</p>
            <p className="mt-1 text-2xl font-semibold">{banner.label}</p>
            {document.rejectReason ? (
              <p className="mt-3 text-sm">เหตุผลที่ปฏิเสธ: {document.rejectReason}</p>
            ) : null}
          </div>
          <StatusBadge status={document.status} />
        </div>
      </div>

      {success ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
      {messageError ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{messageError}</p> : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">การอนุมัติเอกสาร</h2>
            {document.status === "Approved" ? (
              <p className="mt-1 text-sm text-slate-500">
                เอกสารถูกอนุมัติแล้ว หากต้องการแก้ไขกรุณาสร้าง Revision ใหม่
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {canSubmitReview ? (
              <Button
                type="button"
                disabled={Boolean(actionLoading)}
                onClick={() => runWorkflowAction("submit-review", "ส่งเอกสารเข้าตรวจสอบแล้ว")}
              >
                {actionLoading === "submit-review" ? "กำลังส่ง..." : "ส่งตรวจสอบ"}
              </Button>
            ) : null}
            {canReview ? (
              <>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={Boolean(actionLoading)}
                  onClick={() => runWorkflowAction("approve", "อนุมัติเอกสารแล้ว")}
                >
                  {actionLoading === "approve" ? "กำลังส่ง..." : "อนุมัติ"}
                </Button>
                <Button
                  type="button"
                  className="bg-rose-600 hover:bg-rose-700"
                  disabled={Boolean(actionLoading)}
                  onClick={() => setRejectOpen(true)}
                >
                  ปฏิเสธ
                </Button>
              </>
            ) : null}
            {canObsolete ? (
              <Button
                type="button"
                disabled={Boolean(actionLoading)}
                onClick={() => runWorkflowAction("obsolete", "ยกเลิกเอกสารแล้ว")}
              >
                {actionLoading === "obsolete" ? "กำลังส่ง..." : "ยกเลิกเอกสาร"}
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">ข้อมูลเอกสาร {isLocked ? "🔒" : ""}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {metadata.map((item) => (
            <div key={item.label} className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">
                {item.label} {isLocked && item.lockable ? "🔒" : ""}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{item.value || "-"}</p>
            </div>
          ))}
        </div>
      </Card>

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

      {rejectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold">ปฏิเสธเอกสาร</h2>
            <textarea
              className="mt-4 min-h-32 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-teal-600"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="ระบุเหตุผลในการปฏิเสธ"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={rejectLoading}
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason("");
                }}
              >
                ยกเลิก
              </Button>
              <Button type="button" disabled={rejectLoading} onClick={rejectDocument}>
                {rejectLoading ? "กำลังส่ง..." : "ยืนยัน"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
