import * as React from "react";
import { Card } from "@/components/ui/card";

export function Dialog({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </Card>
  );
}
