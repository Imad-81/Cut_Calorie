import type { ReactNode } from "react";

export function ChartTooltipFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="glass-panel min-w-36 rounded-2xl px-3 py-2 text-sm">
      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
        {label}
      </div>
      {children}
    </div>
  );
}
