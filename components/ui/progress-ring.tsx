"use client";

import { cn } from "@/lib/utils";

type Ring = {
  color: string;
  progress: number;
  radius: number;
  strokeWidth: number;
};

function Circle({ color, progress, radius, strokeWidth }: Ring) {
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(progress, 1)));
  return (
    <>
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 500ms ease",
        }}
      />
    </>
  );
}

export function ProgressRing({
  calories,
  calorieTarget,
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fats,
  fatsTarget,
  className,
}: {
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fats: number;
  fatsTarget: number;
  className?: string;
}) {
  return (
    <div className={cn("relative flex h-64 w-64 items-center justify-center", className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200">
        <Circle color="#66d9cc" progress={calories / Math.max(calorieTarget, 1)} radius={90} strokeWidth={8} />
        <Circle color="#ffb954" progress={protein / Math.max(proteinTarget, 1)} radius={75} strokeWidth={6} />
        <Circle color="#ffb3b1" progress={carbs / Math.max(carbsTarget, 1)} radius={62} strokeWidth={6} />
        <Circle color="#84f5e8" progress={fats / Math.max(fatsTarget, 1)} radius={49} strokeWidth={6} />
      </svg>
      <div className="relative text-center">
        <div className="text-4xl font-extrabold tracking-tight text-white">{Math.round(calories)}</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.24em] text-on-surface-variant">
          / {Math.round(calorieTarget)} kcal
        </div>
      </div>
    </div>
  );
}
