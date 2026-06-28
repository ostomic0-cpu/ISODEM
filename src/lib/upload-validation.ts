const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16 MB

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
];

const BLOCKED_EXTENSIONS = [
  ".exe",
  ".js",
  ".html",
  ".svg",
  ".wasm",
  ".zip",
  ".bat",
  ".cmd",
  ".ps1",
  ".sh",
];

export type UploadValidationResult =
  | { valid: true; file: File }
  | { valid: false; error: string; status: number };

/**
 * Validate an uploaded file against size limit and extension allowlist.
 * Must be called BEFORE reading the file into memory (file.arrayBuffer()).
 */
export function validateUpload(file: unknown): UploadValidationResult {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "กรุณาแนบไฟล์", status: 400 };
  }

  if (file.size === 0) {
    return { valid: false, error: "ไฟล์ว่างเปล่า", status: 400 };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "ไฟล์มีขนาดใหญ่เกิน 16 MB",
      status: 413,
    };
  }

  const ext = getExtension(file.name);

  if (!ext) {
    return {
      valid: false,
      error: "ไม่สามารถระบุประเภทไฟล์ได้",
      status: 400,
    };
  }

  // Check blocked list first (more specific override)
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `ไม่อนุญาตให้อัปโหลดไฟล์ประเภท ${ext}`,
      status: 400,
    };
  }

  // Check allowlist
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `ไม่อนุญาตให้อัปโหลดไฟล์ประเภท ${ext}`,
      status: 400,
    };
  }

  return { valid: true, file };
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot).toLowerCase();
}
