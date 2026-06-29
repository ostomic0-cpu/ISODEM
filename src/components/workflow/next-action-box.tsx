"use client";

import { getNextAction, type NextActionMessage } from "@/lib/workflow-utils";

const toneStyles: Record<NextActionMessage["tone"], string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  neutral: "border-slate-200 bg-slate-50 text-slate-800",
};

export function NextActionBox({
  status,
  userRole,
  isOwner,
  className = "",
}: {
  status: string;
  userRole: string | undefined;
  isOwner: boolean;
  className?: string;
}) {
  const action = getNextAction(status, userRole, isOwner);
  return (
    <div className={`rounded-lg border p-4 ${toneStyles[action.tone]} ${className}`}>
      <p className="text-sm font-semibold">{action.short}</p>
      {action.detailed ? (
        <p className="mt-0.5 text-sm opacity-80">{action.detailed}</p>
      ) : null}
    </div>
  );
}
