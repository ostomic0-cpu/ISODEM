import Link from "next/link";

const navItems = [
  { href: "/", label: "แดชบอร์ด" },
  { href: "/folders", label: "โฟลเดอร์" },
  { href: "/documents", label: "ควบคุมเอกสาร" },
  { href: "/audits", label: "ตรวจประเมิน" },
  { href: "/capas", label: "CAPA" },
];

export function Sidebar({ role }: { role: string }) {
  const visibleNavItems = role === "Admin" ? [...navItems, { href: "/users", label: "จัดการผู้ใช้" }] : navItems;

  return (
    <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <div>
          <p className="text-lg font-semibold">QMS</p>
          <p className="text-xs text-slate-500">บทบาท: {role}</p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible">
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
