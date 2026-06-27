import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function thaiStatus(status: string) {
  const map: Record<string, string> = {
    Draft: "ฉบับร่าง",
    Review: "รอตรวจทาน",
    Approved: "อนุมัติแล้ว",
    Archived: "เก็บถาวร",
    InReview: "กำลังตรวจทาน",
    Rejected: "ไม่อนุมัติ",
    Scheduled: "วางแผนแล้ว",
    InProgress: "กำลังดำเนินการ",
    Completed: "เสร็จสิ้น",
    Cancelled: "ยกเลิก",
    Open: "เปิด",
    UnderReview: "กำลังทบทวน",
    Resolved: "แก้ไขแล้ว",
    VerificationPending: "รอตรวจยืนยัน",
    Closed: "ปิดแล้ว",
  };

  return map[status] ?? status;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
