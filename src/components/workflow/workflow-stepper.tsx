"use client";

import { DOCUMENT_LIFECYCLE, isCompleted, isCurrent, stepLabel } from "@/lib/workflow-utils";

/** Inline Check icon SVG */
function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="4" />
    </svg>
  );
}

export function WorkflowStepper({ status }: { status: string }) {
  const steps = DOCUMENT_LIFECYCLE;

  return (
    <div className="w-full overflow-x-auto" role="navigation" aria-label="Document lifecycle steps">
      <ol className="flex min-w-[400px] items-center justify-center gap-0 py-2">
        {steps.map((step, i) => {
          const done = isCompleted(status, step);
          const current = isCurrent(status, step);

          // Step colors
          let stepBg = "bg-slate-200";
          let stepText = "text-slate-400";
          let stepBorder = "border-slate-300";

          if (done) {
            stepBg = "bg-emerald-600";
            stepText = "text-white";
            stepBorder = "border-emerald-600";
          } else if (current) {
            stepBg = "bg-white";
            stepText = "text-teal-700";
            stepBorder = "border-teal-600";
          }

          // Connector line colors
          const connectorDone = done || (current && i > 0);
          const connectorColor = connectorDone ? "bg-emerald-400" : "bg-slate-200";

          return (
            <li key={step} className="flex items-center">
              {/* Connector line before step (except first) */}
              {i > 0 ? (
                <div
                  className={`mx-0.5 h-0.5 w-8 sm:w-12 md:w-16 ${connectorColor} shrink-0`}
                  aria-hidden="true"
                />
              ) : null}

              {/* Step indicator */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${stepBg} ${stepText} ${stepBorder} ${
                    current ? "ring-2 ring-teal-300 ring-offset-1" : ""
                  }`}
                >
                  {done ? <CheckIcon /> : current ? <CircleIcon /> : <span className="text-xs font-semibold">{i + 1}</span>}
                </div>
                <span
                  className={`whitespace-nowrap text-[10px] font-medium leading-tight sm:text-xs ${
                    done
                      ? "text-emerald-700"
                      : current
                        ? "font-semibold text-teal-700"
                        : "text-slate-400"
                  }`}
                >
                  {stepLabel(step)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
