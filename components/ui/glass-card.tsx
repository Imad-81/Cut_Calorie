import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function GlassCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-panel rounded-[20px] p-5", className)} {...props} />;
}
