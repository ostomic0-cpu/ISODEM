"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "แดชบอร์ด" },
  { href: "/folders", label: "โฟลเดอร์" },
  { href: "/documents", label: "ควบคุมเอกสาร" },
  { href: "/audits", label: "ตรวจประเมิน" },
  { href: "/capas", label: "CAPA" },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminItems = [
    ...navItems,
    { href: "/activity", label: "กิจกรรม" },
    { href: "/departments", label: "จัดการแผนก" },
    { href: "/users", label: "จัดการผู้ใช้" },
  ];
  const qaItems = [
    ...navItems,
    { href: "/activity", label: "กิจกรรม" },
  ];
  const visibleNavItems = role === "Admin" ? adminItems : role === "QA" ? qaItems : navItems;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
        {/* Brand + hamburger */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <p className="text-lg font-semibold">QMS</p>
            <p className="text-xs text-slate-500">บทบาท: {role}</p>
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 hover:bg-slate-100 lg:hidden"
            aria-label="เปิดเมนู"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden gap-1 px-3 py-3 lg:flex lg:flex-col">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <p className="text-lg font-semibold">QMS</p>
          <button
            onClick={closeMobile}
            className="rounded-md p-2 hover:bg-slate-100"
            aria-label="ปิดเมนู"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-3">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
