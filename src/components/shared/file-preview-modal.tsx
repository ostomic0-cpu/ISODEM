"use client";

import { useEffect, useCallback } from "react";

type PreviewFile = {
  url: string;
  name: string;
  type: "pdf" | "image" | "unsupported";
};

export function FilePreviewModal({
  file,
  onClose,
}: {
  file: PreviewFile;
  onClose: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function getIcon() {
    switch (file.type) {
      case "pdf":
        return "📄";
      case "image":
        return "🖼️";
      default:
        return "📦";
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <span>{getIcon()}</span>
            <h2 className="truncate text-lg font-semibold">{file.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800"
            >
              ⬇ ดาวน์โหลด
            </a>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-slate-100"
              aria-label="ปิด"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[85vh] overflow-y-auto p-5">
          {file.type === "pdf" ? (
            <object
              data={file.url}
              type="application/pdf"
              className="h-[80vh] w-full rounded"
            >
              <div className="flex flex-col items-center gap-3 py-10 text-center text-slate-500">
                <span className="text-4xl">📄</span>
                <p>เบราว์เซอร์ของคุณไม่รองรับการแสดงไฟล์ PDF</p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 underline"
                >
                  ดาวน์โหลดไฟล์ PDF
                </a>
              </div>
            </object>
          ) : file.type === "image" ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[75vh] w-full rounded object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center text-slate-500">
              <span className="text-6xl">📦</span>
              <p className="text-lg">ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้</p>
              <p className="text-sm">กรุณาดาวน์โหลดเพื่อดูเนื้อหาต้นฉบับ</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 rounded-md bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"
              >
                ⬇ ดาวน์โหลดไฟล์
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
