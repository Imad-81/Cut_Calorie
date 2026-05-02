"use client";

import { useMutation, useQuery } from "convex/react";
import { Camera, Flame, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/ui/page-transition";
import { ProgressRing } from "@/components/ui/progress-ring";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mealTypes, mealTypeLabels } from "@/lib/constants";
import { formatDateLabel, todayKey } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

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
  const deleteFoodLog = useMutation(api.foodLogs.deleteFoodLog);
  const summaries = useQuery(api.dailySummaries.getDailySummariesByRange, {
    from: today,
    to: today,
  });
  const summary = summaries?.[0];
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete(id: Id<"foodLogs">) {
    setDeletingId(id);
    try {
      await deleteFoodLog({ foodLogId: id });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  const dailyCalorieTarget = user?.dailyCalorieTarget ?? 2000;
  const proteinTarget = user?.proteinTarget ?? 150;
  const carbsTarget = user?.carbsTarget ?? 250;
  const fatsTarget = user?.fatsTarget ?? 70;

  const remainingCalories = user ? (dailyCalorieTarget - (summary?.totalCalories ?? 0)) : 0;
  const remainingProtein = user ? (proteinTarget - (summary?.totalProtein ?? 0)) : 0;

  // Added progressive skeleton loading to prevent navigation blank screens
  if (user === undefined) {
    return (
      <AppChrome title="CUT" subtitle="Loading...">
        <PageTransition className="space-y-4">
          <GlassCard className="flex flex-col items-center gap-4 px-4 py-6 animate-pulse">
            <div className="h-6 w-32 rounded bg-white/10" />
            <div className="h-4 w-24 rounded bg-white/10 mt-1" />
            <div className="h-48 w-48 rounded-full bg-white/10" />
            <div className="grid w-full grid-cols-3 gap-3 mt-4">
              <div className="h-20 rounded-[18px] bg-white/5" />
              <div className="h-20 rounded-[18px] bg-white/5" />
              <div className="h-20 rounded-[18px] bg-white/5" />
            </div>
          </GlassCard>
        </PageTransition>
      </AppChrome>
    );
  }
  if (!user) return null;

  return (
    <AppChrome
      title="CUT"
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
            calorieTarget={dailyCalorieTarget}
            protein={summary?.totalProtein ?? 0}
            proteinTarget={proteinTarget}
            carbs={summary?.totalCarbs ?? 0}
            carbsTarget={carbsTarget}
            fats={summary?.totalFats ?? 0}
            fatsTarget={fatsTarget}
          />
          <div className="grid w-full grid-cols-3 gap-3">
            <MacroPill label="Protein" value={summary?.totalProtein ?? 0} target={proteinTarget} color="bg-secondary" />
            <MacroPill label="Carbs" value={summary?.totalCarbs ?? 0} target={carbsTarget} color="bg-tertiary" />
            <MacroPill label="Fats" value={summary?.totalFats ?? 0} target={fatsTarget} color="bg-primary-soft" />
          </div>
        </GlassCard>

        {/* Remaining stats row */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="rounded-[18px] px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              {remainingCalories < 0 ? "Over Limit" : "Remaining"}
            </div>
            <div className={cn("mt-1 text-xl font-bold", remainingCalories < 0 ? "text-[#ffb954]" : "text-white")}>
              {Math.abs(remainingCalories)}
              <span className="ml-1 text-xs font-medium text-on-surface-variant">
                {remainingCalories < 0 ? "over" : "kcal"}
              </span>
            </div>
          </GlassCard>
          <GlassCard className="rounded-[18px] px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              {remainingProtein < 0 ? "Protein over" : "Protein left"}
            </div>
            <div className={cn("mt-1 text-xl font-bold", remainingProtein < 0 ? "text-[#ffb3b1]" : "text-white")}>
              {Math.abs(Math.round(remainingProtein))}
              <span className="ml-1 text-xs font-medium text-on-surface-variant">g</span>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="flex items-center justify-between rounded-[18px] px-4 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Current streak</div>
            <div className="mt-1 flex items-center gap-2 text-xl font-bold text-white">
              <Flame className="h-5 w-5 text-secondary" />
              {summary?.streak ?? 0} days
            </div>
          </div>
          <Link href="/log" prefetch={true} className="flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#66d9cc,#26a69a)] px-4 py-3 text-sm font-semibold text-[#003430]">
            <Camera className="h-4 w-4" />
            Log food
          </Link>
        </GlassCard>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-white">Today&apos;s Log</div>
            <Link href="/history" prefetch={true} className="flex items-center gap-1 text-xs text-on-surface-variant">
              History <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {grouped.map(({ mealType, items }) => (
            <GlassCard key={mealType} className="space-y-3 rounded-[18px] p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">{mealTypeLabels[mealType]}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                  {items.reduce((total, item) => total + item.calories, 0)} kcal
                </div>
              </div>
              {/* Added loading state for food logs to decouple UI rendering from data fetching */}
              {foodLogs === undefined ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 rounded-2xl bg-white/5" />
                </div>
              ) : items.length ? (
                items.map((item) => (
                  <div
                    key={item._id}
                    className="group relative flex items-start justify-between rounded-2xl border border-white/6 bg-black/15 px-3 py-3 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{item.foodName}</div>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {item.servingSize} · P {item.protein}g · C {item.carbs}g · F {item.fats}g
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <div className="text-right text-sm font-semibold text-white">{item.calories}</div>
                      {confirmDelete === item._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-lg bg-white/10 px-2 py-1 text-xs text-on-surface-variant"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item._id}
                            onClick={() => handleDelete(item._id as Id<"foodLogs">)}
                            className="rounded-lg bg-[#ffb3b1]/20 px-2 py-1 text-xs font-semibold text-[#ffb3b1] disabled:opacity-50"
                          >
                            {deletingId === item._id ? "…" : "Delete"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(item._id)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg p-1.5 text-on-surface-variant hover:text-[#ffb3b1] transition-all"
                          aria-label="Delete food log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
