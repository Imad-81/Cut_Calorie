"use client";

import { cn } from "@/lib/utils";

type Ring = {
  color: string;
  progress: number;
  radius: number;
  strokeWidth: number;
  id: string;
};



function Circle({ color, progress, radius, strokeWidth, id }: Ring) {
  const hasOverlap = progress > 1;

  // How far around the circle the overlap tip sits (in degrees)
  const overlapAngle = hasOverlap ? Math.min((progress - 1), 1) * 360 : 0;

  const shadowFilterId = `shadow-${id}`;
  const circumference = 2 * Math.PI * radius;

  return (
    <g>
      {/* SVG filter definitions */}
      <defs>
        {/* Soft shadow for the overlap tip */}
        <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation={strokeWidth * 0.5} floodColor="rgba(0,0,0,5)" />
        </filter>
      </defs>

      {/* 1. Track (empty ring) */}
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />

      {/* 2. Base Filled arc (up to 100%) */}
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(progress, 1))}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 500ms ease",
        }}
      />

      {hasOverlap && (
        <>
          {/* 3. Shadow element at the exact tip of the overlap */}
          <g
            style={{
              transform: `rotate(${overlapAngle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 500ms ease",
            }}
          >
            <circle
              cx="100"
              cy={100 - radius}
              r={strokeWidth / 2}
              fill={color}
              filter={`url(#${shadowFilterId})`}
            />
          </g>

          {/* 4. Overlap arc — drawn on top without shadow to cover the tip shadow's body */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.min(overlapAngle / 360, 1))}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 500ms ease",
            }}
          />
        </>
      )}
    </g>
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
        <Circle id="cal" color="#66d9cc" progress={calories / Math.max(calorieTarget, 1)} radius={90} strokeWidth={8} />
        <Circle id="pro" color="#ffb954" progress={protein / Math.max(proteinTarget, 1)} radius={75} strokeWidth={6} />
        <Circle id="carb" color="#ffb3b1" progress={carbs / Math.max(carbsTarget, 1)} radius={62} strokeWidth={6} />
        <Circle id="fat" color="#84f5e8" progress={fats / Math.max(fatsTarget, 1)} radius={49} strokeWidth={6} />
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
