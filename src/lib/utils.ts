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
    Obsolete: "ล้าสมัย",
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

export const severityLabels: Record<string, string> = {
  OBS: "ข้อสังเกต",
  OFI: "โอกาสพัฒนา",
  MINOR: "ข้อบกพร่องเล็กน้อย",
  MAJOR: "ข้อบกพร่องรุนแรง",
  CAR: "ต้องแก้ไข",
};

export const severityColors: Record<string, string> = {
  OBS: "bg-slate-100 text-slate-700",
  OFI: "bg-blue-100 text-blue-700",
  MINOR: "bg-amber-100 text-amber-800",
  MAJOR: "bg-orange-100 text-orange-800",
  CAR: "bg-red-100 text-red-800",
};

export const priorityLabels: Record<string, string> = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
  CRITICAL: "วิกฤต",
};

export const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};
