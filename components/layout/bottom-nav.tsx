"use client";

import { ChartColumnBig, Home, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/log", label: "Log Food", icon: Plus, primary: true },
  { href: "/history", label: "History", icon: ChartColumnBig },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="glass-panel fixed inset-x-0 bottom-0 z-40 mx-auto flex h-20 max-w-xl items-center justify-around rounded-t-[28px] border-b-0 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-3">
      {items.map(({ href, label, icon: Icon, primary }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-11 min-w-11 flex-col items-center justify-center rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant transition",
              active && !primary && "bg-white/5 text-primary",
              primary &&
                "h-14 w-14 -translate-y-4 bg-[linear-gradient(135deg,#66d9cc,#26a69a)] text-[#003430] shadow-[0_10px_30px_rgba(102,217,204,0.25)]",
            )}
          >
            <Icon className={cn("mb-1 h-5 w-5", primary && "mb-0 h-6 w-6")} />
            {!primary ? label : null}
          </Link>
        );
      })}
    </nav>
  );
}
