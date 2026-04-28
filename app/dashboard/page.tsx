"use client";

import { useQuery } from "convex/react";
import { Camera, Flame } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/ui/page-transition";
import { ProgressRing } from "@/components/ui/progress-ring";
import { api } from "@/convex/_generated/api";
import { mealTypes, mealTypeLabels } from "@/lib/constants";
import { formatDateLabel, todayKey } from "@/lib/nutrition";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardScreen />
    </AuthGuard>
  );
}

function DashboardScreen() {
  const today = todayKey();
  const user = useQuery(api.users.getUserByClerkId, {});
  const foodLogs = useQuery(api.foodLogs.getFoodLogsByDate, { date: today });
  const summaries = useQuery(api.dailySummaries.getDailySummariesByRange, {
    from: today,
    to: today,
  });
  const summary = summaries?.[0];
  const grouped = useMemo(
    () => {
      const logs = foodLogs ?? [];
      return mealTypes.map((mealType) => ({
        mealType,
        items: logs.filter((log) => log.mealType === mealType),
      }));
    },
    [foodLogs],
  );

  if (!user) return null;

  return (
    <AppChrome
      title="The Silent Observer"
      subtitle={formatDateLabel(new Date(), {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
    >
      <PageTransition className="space-y-4">
        <GlassCard className="flex flex-col items-center gap-4 px-4 py-6">
          <div className="text-center">
            <div className="text-2xl font-bold tracking-tight text-white">Today&apos;s Overview</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              {formatDateLabel(new Date(), { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <ProgressRing
            calories={summary?.totalCalories ?? 0}
            calorieTarget={user.dailyCalorieTarget}
            protein={summary?.totalProtein ?? 0}
            proteinTarget={user.proteinTarget}
            carbs={summary?.totalCarbs ?? 0}
            carbsTarget={user.carbsTarget}
            fats={summary?.totalFats ?? 0}
            fatsTarget={user.fatsTarget}
          />
          <div className="grid w-full grid-cols-3 gap-3">
            <MacroPill label="Protein" value={summary?.totalProtein ?? 0} target={user.proteinTarget} color="bg-secondary" />
            <MacroPill label="Carbs" value={summary?.totalCarbs ?? 0} target={user.carbsTarget} color="bg-tertiary" />
            <MacroPill label="Fats" value={summary?.totalFats ?? 0} target={user.fatsTarget} color="bg-primary-soft" />
          </div>
        </GlassCard>

        <GlassCard className="flex items-center justify-between rounded-[18px] px-4 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Current streak</div>
            <div className="mt-1 flex items-center gap-2 text-xl font-bold text-white">
              <Flame className="h-5 w-5 text-secondary" />
              {summary?.streak ?? 0} days
            </div>
          </div>
          <Link
            href="/log"
            className="flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#66d9cc,#26a69a)] px-4 py-3 text-sm font-semibold text-[#003430]"
          >
            <Camera className="h-4 w-4" />
            Log food
          </Link>
        </GlassCard>

        <section className="space-y-3">
          <div className="text-lg font-semibold text-white">Today&apos;s Log</div>
          {grouped.map(({ mealType, items }) => (
            <GlassCard key={mealType} className="space-y-3 rounded-[18px] p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{mealTypeLabels[mealType]}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                  {items.reduce((total, item) => total + item.calories, 0)} kcal
                </div>
              </div>
              {items.length ? (
                items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-start justify-between rounded-2xl border border-white/6 bg-black/15 px-3 py-3"
                  >
                    <div>
                      <div className="font-medium text-white">{item.foodName}</div>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {item.servingSize} · P {item.protein}g · C {item.carbs}g · F {item.fats}g
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-white">{item.calories}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/8 px-3 py-4 text-sm text-on-surface-variant">
                  Nothing logged yet.
                </div>
              )}
            </GlassCard>
          ))}
        </section>
      </PageTransition>
    </AppChrome>
  );
}

function MacroPill({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  return (
    <div className="rounded-[18px] bg-surface-container-low px-3 py-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">{label}</span>
      </div>
      <div className="mt-2 text-lg font-bold text-white">
        {Math.round(value)}
        <span className="ml-1 text-xs font-medium text-on-surface-variant">/ {target}g</span>
      </div>
    </div>
  );
}
