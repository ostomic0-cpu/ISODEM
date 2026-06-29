import { thaiStatus } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  InReview: "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Obsolete: "bg-rose-100 text-rose-800",
  Rejected: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  const styles = statusStyles[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {thaiStatus(status)}
    </span>
  );
}
