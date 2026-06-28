"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type ActivityItem = {
  id: string;
  action: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: { name: string };
  };
  metadata: string;
  createdAt: string;
};

type ActivityResponse = {
  activities: ActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type ActivityMetadata = Record<string, unknown>;

const pageSize = 20;

const actionLabels: Record<string, string> = {
  "login.success": "เข้าสู่ระบบ",
  "document.created": "สร้างเอกสาร",
  "document.submitted": "ส่งตรวจสอบ",
  "document.approved": "อนุมัติเอกสาร",
  "document.rejected": "ปฏิเสธเอกสาร",
  "document.obsoleted": "ลบล้างเอกสาร",
  "revision.created": "เพิ่มเวอร์ชัน",
  "user.created": "สร้างผู้ใช้",
  "user.updated": "แก้ไขผู้ใช้",
  "user.disabled": "ปิดใช้งานผู้ใช้",
  "audit.created": "สร้างตรวจประเมิน",
  "audit.status_changed": "เปลี่ยนสถานะตรวจประเมิน",
  "capa.created": "สร้าง CAPA",
  "capa.status_changed": "เปลี่ยนสถานะ CAPA",
  "capa.due_date_changed": "เปลี่ยนกำหนดแล้วเสร็จ",
};

function parseMetadata(metadata: string): ActivityMetadata | null {
  try {
    const parsed = JSON.parse(metadata);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function valueToText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function metadataDetail(activity: ActivityItem) {
  const metadata = parseMetadata(activity.metadata);
  if (!metadata) return activity.metadata;

  switch (activity.action) {
    case "document.created":
      return `${valueToText(metadata.docNumber)}: ${valueToText(metadata.title)}`;
    case "document.submitted":
      return `${valueToText(metadata.docNumber)}: ${valueToText(metadata.title)} → ส่งตรวจสอบ`;
    case "document.approved":
      return `${valueToText(metadata.docNumber)}: ${valueToText(metadata.title)} → อนุมัติ`;
    case "document.rejected":
      return `${valueToText(metadata.docNumber)}: ${valueToText(metadata.title)} → ปฏิเสธ`;
    case "document.obsoleted":
      return `${valueToText(metadata.docNumber)}: ${valueToText(metadata.title)} → ลบล้าง`;
    case "revision.created":
      return `${valueToText(metadata.documentId)} เวอร์ชัน ${valueToText(metadata.versionNumber)}`;
    case "user.created":
    case "user.updated":
    case "login.success":
      return `${valueToText(metadata.name)} (${valueToText(metadata.email)})`;
    case "user.disabled":
      return valueToText(metadata.targetUserId);
    case "audit.created":
      return `${valueToText(metadata.title)} [${valueToText(metadata.status)}]`;
    case "audit.status_changed":
      return `${valueToText(metadata.title)} → ${valueToText(metadata.status)}`;
    case "capa.created":
      return `#${valueToText(metadata.capaId)}`;
    case "capa.status_changed":
      return `CAPA #${valueToText(metadata.capaId)} → ${valueToText(metadata.status)}`;
    case "capa.due_date_changed":
      return `CAPA #${valueToText(metadata.capaId)} → ${valueToText(metadata.targetDate)}`;
    default:
      return "-";
  }
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        const response = await fetch(`/api/activity?${params.toString()}`);

        if (!response.ok) {
          setError("โหลดข้อมูลไม่สำเร็จ");
          setLoading(false);
          return;
        }

        const body = (await response.json()) as ActivityResponse;
        setActivities(body.activities ?? []);
        setTotal(body.total ?? 0);
        setTotalPages(body.totalPages ?? 0);
      } catch {
        setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, reloadKey]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-5">
          <h1 className="text-2xl font-semibold">บันทึกกิจกรรมระบบ</h1>
        </div>

        {loading ? (
          <p className="text-slate-500">กำลังโหลด...</p>
        ) : error ? (
          <div className="space-y-3">
            <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">โหลดข้อมูลไม่สำเร็จ</p>
            <Button variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>
              ลองอีกครั้ง
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-slate-500">ยังไม่มีบันทึกกิจกรรม</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th className="w-[24%] min-w-56">ผู้ใช้</Th>
                    <Th className="w-[18%] min-w-40">การกระทำ</Th>
                    <Th className="w-[38%] min-w-72">รายละเอียด</Th>
                    <Th className="w-[20%] min-w-36">เวลา</Th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <Td>
                        <span className="font-medium text-slate-900">
                          {activity.user.name} ({activity.user.role.name})
                        </span>
                      </Td>
                      <Td>{actionLabels[activity.action] ?? activity.action}</Td>
                      <Td>
                        <div className="max-w-xl truncate" title={metadataDetail(activity)}>
                          {metadataDetail(activity)}
                        </div>
                      </Td>
                      <Td>{formatDate(activity.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                หน้า {page} จาก {totalPages} (ทั้งหมด {total} รายการ)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>
                  ก่อนหน้า
                </Button>
                <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>
                  ถัดไป
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
