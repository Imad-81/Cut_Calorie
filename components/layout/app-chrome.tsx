"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AppChrome({
  children,
  title,
  subtitle,
  hideNav,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  hideNav?: boolean;
}) {
  const { user } = useUser();

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-4 pt-6 safe-bottom">
      <header className="glass-panel sticky top-4 z-30 mb-6 flex h-16 items-center justify-between rounded-[20px] px-4">
        <div className="flex items-center gap-3">
          <div className="overflow-hidden rounded-full">
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: "h-9 w-9" },
              }}
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="text-xs text-on-surface-variant">
              {subtitle ?? user?.fullName ?? "The Silent Observer"}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-primary transition",
            "bg-white/5 hover:bg-white/10",
          )}
        >
          <Bell className="h-5 w-5" />
        </button>
      </header>
      {children}
      {hideNav ? null : <BottomNav />}
    </div>
  );
}
