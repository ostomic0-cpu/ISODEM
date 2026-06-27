import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function Th(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600", props.className)} {...props} />;
}

export function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-slate-100 px-3 py-3 align-top", props.className)} {...props} />;
}
