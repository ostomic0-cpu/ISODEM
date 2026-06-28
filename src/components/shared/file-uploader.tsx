"use client";

export function FileUploader({ name = "file" }: { name?: string }) {
  return (
    <div className="space-y-1">
      <input
        name={name}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt"
        className="block w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
      />
      <p className="text-xs text-slate-400">
        ไฟล์ไม่เกิน 16 MB — ประเภทที่รองรับ: PDF, PNG, JPG, WebP, DOC, DOCX, XLS, XLSX, TXT
      </p>
    </div>
  );
}
