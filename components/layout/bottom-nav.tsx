"use client";

import { ChartColumnBig, Home, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/log", label: "Log", icon: Plus },
  { href: "/history", label: "History", icon: ChartColumnBig },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="glass-panel fixed inset-x-0 bottom-0 z-40 mx-auto flex h-20 max-w-xl items-center justify-around rounded-t-[28px] border-b-0 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-11 min-w-11 flex-col items-center justify-center rounded-2xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition",
              active ? "bg-white/5 text-primary" : "text-on-surface-variant hover:text-white hover:bg-white/5",
            )}
          >
            <Icon className="mb-1 h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
