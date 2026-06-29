"use client";

import { useEffect, useMemo, useState } from "react";

type Department = {
  id: string;
  name: string;
  parentId?: string | null;
  children?: Department[];
  _count?: { children: number };
};

type DepartmentDropdownProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  departments?: Department[];
  className?: string;
};

function buildTree(flat: Department[]): Department[] {
  const map = new Map<string, Department>();
  for (const d of flat) map.set(d.id, { ...d });
  const roots: Department[] = [];
  for (const d of flat) {
    if (d.parentId && map.has(d.parentId)) {
      const parent = map.get(d.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(map.get(d.id)!);
    } else if (!d.parentId) {
      roots.push(map.get(d.id)!);
    }
  }
  return roots;
}

function flattenTree(nodes: Department[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth });
    if (node.children) result.push(...flattenTree(node.children, depth + 1));
  }
  return result;
}

export function DepartmentDropdown({
  name,
  value,
  defaultValue,
  onChange,
  required,
  placeholder,
  departments: externalDepts,
  className,
}: DepartmentDropdownProps) {
  const [loadedDepts, setLoadedDepts] = useState<Department[]>([]);
  const [loaded, setLoaded] = useState(!!externalDepts);

  // If external depts are provided, use them directly; otherwise fetch
  const depts = externalDepts ?? loadedDepts;

  useEffect(() => {
    if (externalDepts) return;
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/departments");
        if (res.ok && mounted) setLoadedDepts(await res.json());
      } catch {
        // silent fallback
      }
      if (mounted) setLoaded(true);
    }
    load();
    return () => { mounted = false; };
  }, [externalDepts]);

  const tree = useMemo(() => buildTree(depts), [depts]);
  const flat = useMemo(() => flattenTree(tree), [tree]);

  const isControlled = onChange !== undefined;
  const baseClass = className || "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

  if (!loaded) {
    return (
      <select
        name={name}
        required={required}
        defaultValue=""
        className={baseClass}
        disabled
      >
        <option value="">กำลังโหลด...</option>
      </select>
    );
  }

  if (isControlled) {
    return (
      <select
        name={name}
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      >
        <option value="">{placeholder || "ไม่ระบุแผนก"}</option>
        {flat.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {"\u00A0".repeat(dept.depth * 4)}{dept.depth > 0 ? "─ " : ""}{dept.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      name={name}
      required={required}
      defaultValue={defaultValue ?? ""}
      className={baseClass}
    >
      <option value="">{placeholder || "ไม่ระบุแผนก"}</option>
      {flat.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {"\u00A0".repeat(dept.depth * 4)}{dept.depth > 0 ? "─ " : ""}{dept.name}
        </option>
      ))}
    </select>
  );
}
