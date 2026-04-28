"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { ChartTooltipFrame } from "@/components/ui/chart-tooltip";
import { PageTransition } from "@/components/ui/page-transition";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mealTypeLabels } from "@/lib/constants";
import { shiftDate, todayKey } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryScreen />
    </AuthGuard>
  );
}

function HistoryScreen() {
  const [tab, setTab] = useState<"analytics" | "foodlog">("analytics");
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");
  const today = todayKey();
  const from = shiftDate(today, range === "weekly" ? -6 : -29);
  const user = useQuery(api.users.getUserByClerkId, {});
  const summaries = useQuery(api.dailySummaries.getDailySummariesByRange, { from, to: today });
  const weightLogs = useQuery(api.weightLogs.getWeightLogsByUserId, {});
  const resolvedWeightLogs = weightLogs ?? [];

  const caloriesData = useMemo(
    () => {
      const items = summaries ?? [];
      return items.map((item) => ({
        date: item.date.slice(5),
        calories: item.totalCalories,
        target: item.calorieTarget,
        over: item.totalCalories > item.calorieTarget,
      }));
    },
    [summaries],
  );
  const macros = useMemo(() => {
    const items = summaries ?? [];
    const totals = items.reduce(
      (acc, item) => {
        acc.protein += item.totalProtein;
        acc.carbs += item.totalCarbs;
        acc.fats += item.totalFats;
        return acc;
      },
      { protein: 0, carbs: 0, fats: 0 },
    );
    const sum = totals.protein + totals.carbs + totals.fats || 1;
    return [
      { name: "Protein", value: totals.protein, fill: "#ffb954", percent: Math.round((totals.protein / sum) * 100) },
      { name: "Carbs", value: totals.carbs, fill: "#66d9cc", percent: Math.round((totals.carbs / sum) * 100) },
      { name: "Fats", value: totals.fats, fill: "#ffb3b1", percent: Math.round((totals.fats / sum) * 100) },
    ];
  }, [summaries]);
  const consistency = (summaries ?? []).filter((item) => item.totalCalories > 0).length;
  const onTrack =
    resolvedWeightLogs.length >= 3 &&
    resolvedWeightLogs.slice(-3)[0].weight > resolvedWeightLogs.slice(-3)[1].weight &&
    resolvedWeightLogs.slice(-3)[1].weight > resolvedWeightLogs.slice(-3)[2].weight;

  if (!user) return null;

  return (
    <AppChrome title="Analytics" subtitle="Review your recent performance">
      <PageTransition className="space-y-4">
        {/* Top-level tab: Analytics vs Food Log */}
        <div className="flex rounded-full bg-surface-container-low p-1">
          {(["analytics", "foodlog"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "min-h-11 flex-1 rounded-full px-4 py-2 text-sm font-medium capitalize",
                tab === value ? "bg-surface-container-high text-white" : "text-on-surface-variant",
              )}
            >
              {value === "analytics" ? "Analytics" : "Food Log"}
            </button>
          ))}
        </div>

        {tab === "analytics" ? (
          <>
            {/* Range selector */}
            <div className="flex rounded-full bg-surface-container-low p-1">
              {(["weekly", "monthly"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRange(value)}
                  className={cn(
                    "min-h-11 flex-1 rounded-full px-4 py-2 text-sm font-medium capitalize",
                    range === value ? "bg-surface-container-high text-white" : "text-on-surface-variant",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>

            <GlassCard className="rounded-[24px] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">Calorie Intake</div>
                  <div className="text-sm text-on-surface-variant">Last {range === "weekly" ? 7 : 30} days</div>
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                  Goal {user.dailyCalorieTarget}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caloriesData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#bcc9c6", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#bcc9c6", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CaloriesTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <ReferenceLine y={user.dailyCalorieTarget} stroke="#869391" strokeDasharray="4 4" />
                    <Bar dataKey="calories" radius={[8, 8, 0, 0]}>
                      {caloriesData.map((entry) => (
                        <Cell key={entry.date} fill={entry.over ? "#ffb954" : "#66d9cc"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="rounded-[24px] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Weight Progress</div>
                {onTrack ? (
                  <div className="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">On track!</div>
                ) : null}
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={resolvedWeightLogs.map((log) => ({
                      date: new Date(log.loggedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
                      weight: log.weight,
                    }))}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#bcc9c6", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#bcc9c6", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<WeightTooltip />} />
                    <Line type="monotone" dataKey="weight" stroke="#66d9cc" strokeWidth={3} dot={{ r: 4, fill: "#66d9cc" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="rounded-[24px] p-4">
                <div className="text-sm font-semibold text-white">Macro Distribution</div>
                <div className="mt-4 flex h-40 items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macros} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={4} />
                      <Tooltip content={<MacroTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {macros.map((m) => (
                    <div key={m.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: m.fill }} />
                        <span className="text-on-surface-variant">{m.name}</span>
                      </div>
                      <span className="font-semibold text-white">{m.percent}%</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="rounded-[24px] p-4">
                <div className="text-sm font-semibold text-white">Consistency</div>
                <div className="mt-6 text-3xl font-bold tracking-tight text-white">
                  {consistency}/{range === "weekly" ? 7 : 30}
                </div>
                <div className="mt-2 text-sm text-on-surface-variant">Days with logged meals.</div>
                <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#66d9cc,#26a69a)]"
                    style={{ width: `${(consistency / (range === "weekly" ? 7 : 30)) * 100}%` }}
                  />
                </div>
              </GlassCard>
            </div>
          </>
        ) : (
          <FoodLogTab today={today} />
        )}
      </PageTransition>
    </AppChrome>
  );
}

function FoodLogTab({ today }: { today: string }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const foodLogs = useQuery(api.foodLogs.getFoodLogsByDate, { date: selectedDate });
  const deleteFoodLog = useMutation(api.foodLogs.deleteFoodLog);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function changeDay(delta: number) {
    const next = shiftDate(selectedDate, delta);
    if (next <= today) setSelectedDate(next);
  }

  async function handleDelete(id: Id<"foodLogs">) {
    setDeletingId(id);
    try {
      await deleteFoodLog({ foodLogId: id });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  const displayDate = (() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (selectedDate === today) return "Today";
    return date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
  })();

  const totalCalories = (foodLogs ?? []).reduce((sum, log) => sum + log.calories, 0);

  // Group by meal type
  const grouped = useMemo(() => {
    const logs = foodLogs ?? [];
    const groups: Record<string, typeof logs> = {};
    for (const log of logs) {
      if (!groups[log.mealType]) groups[log.mealType] = [];
      groups[log.mealType].push(log);
    }
    return groups;
  }, [foodLogs]);

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <GlassCard className="flex items-center justify-between rounded-[18px] px-4 py-3">
        <button
          type="button"
          onClick={() => changeDay(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white transition-colors hover:bg-white/12"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="font-semibold text-white">{displayDate}</div>
          <div className="text-xs text-on-surface-variant">{totalCalories} kcal total</div>
        </div>
        <button
          type="button"
          onClick={() => changeDay(1)}
          disabled={selectedDate >= today}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white transition-colors hover:bg-white/12 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </GlassCard>

      {foodLogs === undefined ? (
        <div className="py-8 text-center text-sm text-on-surface-variant">Loading…</div>
      ) : foodLogs.length === 0 ? (
        <GlassCard className="rounded-[24px] p-8 text-center">
          <div className="text-sm text-on-surface-variant">No meals logged for this day.</div>
        </GlassCard>
      ) : (
        Object.entries(grouped).map(([mealType, items]) => (
          <GlassCard key={mealType} className="space-y-3 rounded-[18px] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">
                {mealTypeLabels[mealType as keyof typeof mealTypeLabels] ?? mealType}
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                {items.reduce((t, i) => t + i.calories, 0)} kcal
              </div>
            </div>
            {items.map((item) => (
              <div
                key={item._id}
                className="group relative flex items-start justify-between rounded-2xl border border-white/6 bg-black/15 px-3 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.foodName}</div>
                  <div className="mt-1 text-xs text-on-surface-variant">
                    {item.servingSize} · P {item.protein}g · C {item.carbs}g · F {item.fats}g
                    {item.loggedViaAI ? " · 🤖" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <div className="text-sm font-semibold text-white">{item.calories} kcal</div>
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
            ))}
          </GlassCard>
        ))
      )}
    </div>
  );
}

function CaloriesTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <ChartTooltipFrame label={label}>
      <div className="font-semibold text-white">{payload[0].value} kcal</div>
    </ChartTooltipFrame>
  );
}

function WeightTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <ChartTooltipFrame label={label}>
      <div className="font-semibold text-white">{payload[0].value} kg</div>
    </ChartTooltipFrame>
  );
}

function MacroTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; percent: number } }> }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <ChartTooltipFrame label={entry.name}>
      <div className="font-semibold text-white">{entry.percent}%</div>
    </ChartTooltipFrame>
  );
}
