"use client";

import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm text-slate-500">ระบบบริหารคุณภาพ</p>
          <p className="font-semibold">{user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">{user.department}</span>
          <Button variant="secondary" onClick={logout}>
            ออกจากระบบ
          </Button>
        </div>
      </div>
    </header>
  );
}
