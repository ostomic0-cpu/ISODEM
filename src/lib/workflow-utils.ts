/** Document lifecycle workflow order */
export const DOCUMENT_LIFECYCLE = ["Draft", "InReview", "Approved", "Obsolete"] as const;
export type DocumentStatus = (typeof DOCUMENT_LIFECYCLE)[number];

/** Status step index in lifecycle */
export function stepIndex(status: string): number {
  const idx = DOCUMENT_LIFECYCLE.indexOf(status as DocumentStatus);
  return idx >= 0 ? idx : -1;
}

/** Whether a step is completed (before current) */
export function isCompleted(status: string, target: string): boolean {
  const current = stepIndex(status);
  const targetIdx = DOCUMENT_LIFECYCLE.indexOf(target as DocumentStatus);
  return targetIdx >= 0 && targetIdx < current;
}

/** Whether a step is the current one */
export function isCurrent(status: string, target: string): boolean {
  return status === target;
}

/** Stepper label with Thai text */
export function stepLabel(status: string): string {
  const map: Record<string, string> = {
    Draft: "ฉบับร่าง",
    InReview: "กำลังตรวจทาน",
    Approved: "อนุมัติแล้ว",
    Obsolete: "ล้าสมัย",
  };
  return map[status] ?? status;
}

export type NextActionMessage = {
  short: string;
  detailed: string;
  tone: "info" | "warning" | "success" | "neutral";
};

/**
 * Get next action message for document detail page.
 * Based on document status + user role + ownership.
 */
export function getNextAction(
  status: string,
  userRole: string | undefined,
  isOwner: boolean
): NextActionMessage {
  const isAdmin = userRole === "Admin";
  const isQa = userRole === "QA";
  const isReviewer = isAdmin || isQa;

  switch (status) {
    case "Draft":
      if (isOwner || isReviewer) {
        return {
          short: "⚠️ เอกสารยังเป็นฉบับร่าง",
          detailed: "กรุณาเพิ่มไฟล์เอกสารและส่งตรวจสอบเพื่อให้ QA/Admin ตรวจทาน",
          tone: "warning",
        };
      }
      return {
        short: "⏳ เอกสารยังเป็นฉบับร่าง",
        detailed: "รอให้เจ้าของเอกสารส่งตรวจสอบ",
        tone: "info",
      };

    case "InReview":
      if (isReviewer) {
        return {
          short: "📋 กำลังรอการตรวจสอบ",
          detailed: "กดปุ่มเพื่อ อนุมัติ หรือ ปฏิเสธ พร้อมระบุเหตุผล",
          tone: "info",
        };
      }
      if (isOwner) {
        return {
          short: "⏳ ส่งตรวจสอบแล้ว",
          detailed: "รอผลการพิจารณาจาก QA/Admin",
          tone: "info",
        };
      }
      return {
        short: "⏳ กำลังตรวจสอบ",
        detailed: "รอ QA/Admin ดำเนินการ",
        tone: "info",
      };

    case "Approved":
      if (isAdmin) {
        return {
          short: "✅ อนุมัติแล้ว",
          detailed: "กดยกเลิกเอกสารได้เมื่อเลิกใช้งาน หรือต้องการยกเลิกเอกสารนี้",
          tone: "success",
        };
      }
      return {
        short: "✅ อนุมัติแล้ว",
        detailed: "เอกสารได้รับการอนุมัติและพร้อมใช้งาน",
        tone: "success",
      };

    case "Obsolete":
      return {
        short: "ℹ️ เลิกใช้งานแล้ว",
        detailed: "เอกสารนี้เลิกใช้งานแล้ว — สามารถดูประวัติเวอร์ชันย้อนหลังได้",
        tone: "neutral",
      };

    default:
      return {
        short: `สถานะ: ${status}`,
        detailed: "",
        tone: "neutral",
      };
  }
}
