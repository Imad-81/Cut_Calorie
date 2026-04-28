"use client";

import { useQuery } from "convex/react";
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
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { ChartTooltipFrame } from "@/components/ui/chart-tooltip";
import { PageTransition } from "@/components/ui/page-transition";
import { api } from "@/convex/_generated/api";
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
          </GlassCard>
          <GlassCard className="rounded-[24px] p-4">
            <div className="text-sm font-semibold text-white">Consistency</div>
            <div className="mt-6 text-3xl font-bold tracking-tight text-white">
              {consistency}/{range === "weekly" ? 7 : 30}
            </div>
            <div className="mt-2 text-sm text-on-surface-variant">Days with logged meals.</div>
          </GlassCard>
        </div>
      </PageTransition>
    </AppChrome>
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
