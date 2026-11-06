"use client";

import { LayoutDashboardIcon, UsersIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { can, type Permission, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; permission?: Permission };

// Novos módulos entram aqui conforme forem implementados.
const ITEMS: NavItem[] = [
  { href: "", label: "Visão geral", icon: LayoutDashboardIcon },
  { href: "/equipe", label: "Equipe", icon: UsersIcon },
];

export function NavLinks({ slug, role }: { slug: string; role: Role }) {
  const pathname = usePathname();
  const base = `/app/${slug}`;

  return (
    <nav aria-label="Navegação principal" className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.filter((item) => !item.permission || can(role, item.permission)).map((item) => {
        const href = base + item.href;
        const active = item.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
