"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  PencilLine,
  Scale,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Check,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/ui/page-transition";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  activityLabels,
  activityLevels,
  genders,
  objectiveLabels,
  primaryObjectives,
} from "@/lib/constants";
import { calculateBmi, getBmiCategory } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileScreen />
    </AuthGuard>
  );
}

// ─── Gender labels ────────────────────────────────────────────────────────────
const genderLabels: Record<(typeof genders)[number], string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

function ProfileScreen() {
  const { user: clerkUser } = useUser();
  const user = useQuery(api.users.getUserByClerkId, {});
  const latestWeight = useQuery(api.weightLogs.getLatestWeight, {});
  const weightLogs = useQuery(api.weightLogs.getWeightLogsByUserId, {});
  const saveUser = useMutation(api.users.createOrUpdateUser);
  const addWeightLog = useMutation(api.weightLogs.addWeightLog);
  const deleteWeightLog = useMutation(api.weightLogs.deleteWeightLog);

  // Weight logging state
  const [draftWeight, setDraftWeight] = useState("");
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [showWeightHistory, setShowWeightHistory] = useState(false);
  const [confirmDeleteWeight, setConfirmDeleteWeight] = useState<string | null>(null);
  const [deletingWeightId, setDeletingWeightId] = useState<string | null>(null);

  // Health details editing state
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [healthDraft, setHealthDraft] = useState<{
    height: string;
    age: string;
    gender: (typeof genders)[number];
    activityLevel: (typeof activityLevels)[number];
  } | null>(null);
  const [isSavingHealth, setIsSavingHealth] = useState(false);

  const bmi = useMemo(() => calculateBmi(latestWeight?.weight, user?.height), [latestWeight?.weight, user?.height]);
  const bmiPercent = bmi ? Math.max(0, Math.min(100, ((bmi - 15) / 20) * 100)) : 0;

  // Prevent render blocking by showing a skeleton while user data is fetching
  if (user === undefined || !clerkUser) {
    return (
      <AppChrome title="Health Profile" subtitle="Loading...">
        <PageTransition className="space-y-4">
          <GlassCard className="rounded-[24px] p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-6 w-32 rounded bg-white/10" />
                <div className="h-4 w-40 rounded bg-white/5" />
              </div>
            </div>
          </GlassCard>
          <GlassCard className="rounded-[24px] p-5 animate-pulse h-48">
             <div className="h-6 w-32 rounded bg-white/10 mb-4" />
             <div className="grid grid-cols-2 gap-3">
               <div className="h-16 rounded-[18px] bg-white/5" />
               <div className="h-16 rounded-[18px] bg-white/5" />
               <div className="h-16 rounded-[18px] bg-white/5" />
               <div className="h-16 rounded-[18px] bg-white/5" />
             </div>
          </GlassCard>
        </PageTransition>
      </AppChrome>
    );
  }
  if (!user) return null;
  const currentUser = user;
  const currentClerkUser = clerkUser;

  // ── Shared persist helper ─────────────────────────────────────────────────
  async function persistUser(overrides: Partial<{
    height: number;
    age: number;
    gender: (typeof genders)[number];
    activityLevel: (typeof activityLevels)[number];
    dailyCalorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatsTarget: number;
    primaryObjective: (typeof primaryObjectives)[number];
  }>) {
    await saveUser({
      name: currentClerkUser.fullName ?? currentUser.name,
      email: currentClerkUser.primaryEmailAddress?.emailAddress ?? currentUser.email,
      avatarUrl: currentClerkUser.imageUrl ?? currentUser.avatarUrl,
      height: overrides.height ?? currentUser.height ?? 170,
      age: overrides.age ?? currentUser.age ?? 25,
      gender: overrides.gender ?? currentUser.gender ?? "male",
      activityLevel: overrides.activityLevel ?? currentUser.activityLevel ?? "moderate",
      primaryObjective: overrides.primaryObjective ?? currentUser.primaryObjective ?? "maintenance",
      dailyCalorieTarget: overrides.dailyCalorieTarget ?? currentUser.dailyCalorieTarget ?? 2000,
      proteinTarget: overrides.proteinTarget ?? currentUser.proteinTarget ?? 150,
      carbsTarget: overrides.carbsTarget ?? currentUser.carbsTarget ?? 250,
      fatsTarget: overrides.fatsTarget ?? currentUser.fatsTarget ?? 70,
    });
  }

  // ── Health editing handlers ───────────────────────────────────────────────
  function startEditHealth() {
    setHealthDraft({
      height: String(currentUser.height ?? 170),
      age: String(currentUser.age ?? 25),
      gender: currentUser.gender ?? "male",
      activityLevel: currentUser.activityLevel ?? "moderate",
    });
    setIsEditingHealth(true);
  }

  function cancelEditHealth() {
    setIsEditingHealth(false);
    setHealthDraft(null);
  }

  async function saveHealth() {
    if (!healthDraft) return;
    const heightNum = Number(healthDraft.height);
    const ageNum = Number(healthDraft.age);
    if (!Number.isFinite(heightNum) || heightNum <= 0) return;
    if (!Number.isFinite(ageNum) || ageNum <= 0) return;
    setIsSavingHealth(true);
    try {
      await persistUser({
        height: heightNum,
        age: ageNum,
        gender: healthDraft.gender,
        activityLevel: healthDraft.activityLevel,
      });
      setIsEditingHealth(false);
      setHealthDraft(null);
    } finally {
      setIsSavingHealth(false);
    }
  }

  // ── Weight delete ─────────────────────────────────────────────────────────
  async function handleDeleteWeight(id: Id<"weightLogs">) {
    setDeletingWeightId(id);
    try {
      await deleteWeightLog({ weightLogId: id });
    } finally {
      setDeletingWeightId(null);
      setConfirmDeleteWeight(null);
    }
  }

  const sortedWeightLogs = useMemo(
    () => [...(weightLogs ?? [])].sort((a, b) => b.loggedAt - a.loggedAt),
    [weightLogs],
  );

  return (
    <AppChrome title="Health Profile" subtitle={currentClerkUser.primaryEmailAddress?.emailAddress}>
      <PageTransition className="space-y-4">

        {/* ── Avatar card ─────────────────────────────────────────────────── */}
        <GlassCard className="rounded-[24px] p-5">
          <div className="flex items-center gap-4">
            <Image
              src={currentClerkUser.imageUrl}
              alt={currentUser.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
              unoptimized
            />
            <div>
              <div className="text-xl font-semibold text-white">{currentUser.name}</div>
              <div className="text-sm text-on-surface-variant">{currentUser.email}</div>
            </div>
          </div>
        </GlassCard>

        {/* ── Health stats + edit ──────────────────────────────────────────── */}
        <GlassCard className="rounded-[24px] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-on-surface-variant" />
              <span className="text-sm font-semibold text-white">Health Details</span>
            </div>
            {!isEditingHealth ? (
              <button
                type="button"
                onClick={startEditHealth}
                className="flex items-center gap-1.5 rounded-full border border-white/8 bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-white transition-colors"
              >
                <PencilLine className="h-3 w-3" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditHealth}
                  className="flex items-center gap-1 rounded-full border border-white/8 px-3 py-1.5 text-xs text-on-surface-variant hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveHealth}
                  disabled={isSavingHealth}
                  className="flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#66d9cc,#26a69a)] px-3 py-1.5 text-xs font-semibold text-[#003430] disabled:opacity-60"
                >
                  <Check className="h-3 w-3" />
                  {isSavingHealth ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          {!isEditingHealth ? (
            /* Read-only grid */
            <div className="grid grid-cols-2 gap-3">
              <StatChip label="Height" value={currentUser.height ? `${currentUser.height} cm` : "—"} />
              <StatChip label="Age" value={currentUser.age ? `${currentUser.age} yrs` : "—"} />
              <StatChip label="Gender" value={currentUser.gender ? genderLabels[currentUser.gender] : "—"} />
              <StatChip label="Activity" value={currentUser.activityLevel ? activityLabels[currentUser.activityLevel] : "—"} />
              <StatChip label="Current Weight" value={latestWeight ? `${latestWeight.weight} kg` : "—"} />
              <StatChip label="BMI" value={bmi ? `${bmi}` : "—"} highlight={bmi !== null} />
            </div>
          ) : healthDraft ? (
            /* Edit form */
            <div className="space-y-4">
              {/* Height + Age row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={healthDraft.height}
                    onChange={(e) => setHealthDraft({ ...healthDraft, height: e.target.value })}
                    className="h-11 w-full rounded-2xl border border-white/8 bg-surface-container-low px-3 text-white outline-none focus:border-primary/50"
                    placeholder="170"
                    min={50}
                    max={250}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                    Age (yrs)
                  </label>
                  <input
                    type="number"
                    value={healthDraft.age}
                    onChange={(e) => setHealthDraft({ ...healthDraft, age: e.target.value })}
                    className="h-11 w-full rounded-2xl border border-white/8 bg-surface-container-low px-3 text-white outline-none focus:border-primary/50"
                    placeholder="25"
                    min={10}
                    max={120}
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {genders.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setHealthDraft({ ...healthDraft, gender: g })}
                      className={cn(
                        "rounded-2xl border border-white/8 px-3 py-2.5 text-sm transition-colors",
                        healthDraft.gender === g
                          ? "bg-primary/12 text-white border-primary/30"
                          : "bg-surface-container-low text-on-surface-variant hover:text-white",
                      )}
                    >
                      {genderLabels[g]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity level */}
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                  Activity Level
                </label>
                <div className="space-y-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setHealthDraft({ ...healthDraft, activityLevel: level })}
                      className={cn(
                        "w-full rounded-2xl border border-white/8 px-4 py-2.5 text-left text-sm transition-colors",
                        healthDraft.activityLevel === level
                          ? "bg-primary/12 text-white border-primary/30"
                          : "bg-surface-container-low text-on-surface-variant hover:text-white",
                      )}
                    >
                      {activityLabels[level]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </GlassCard>

        {/* ── BMI indicator ────────────────────────────────────────────────── */}
        <GlassCard className="rounded-[24px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">BMI Indicator</div>
            {bmi && (
              <div className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                bmi < 18.5 ? "bg-[#ffb954]/12 text-[#ffb954]" :
                bmi < 25 ? "bg-[#66d9cc]/12 text-[#66d9cc]" :
                "bg-[#ffb3b1]/12 text-[#ffb3b1]",
              )}>
                {getBmiCategory(bmi)} · {bmi}
              </div>
            )}
          </div>
          <div className="h-2 rounded-full bg-[linear-gradient(90deg,#ffb954_0_25%,#66d9cc_25%_60%,#ffb3b1_60%_100%)]" />
          <div className="relative mt-2 h-5">
            <div
              className="absolute top-0 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-black transition-all duration-500"
              style={{ left: `${bmiPercent}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-on-surface-variant">
            <span>Underweight</span><span>Normal</span><span>Overweight</span>
          </div>
        </GlassCard>

        {/* ── Weight logging ───────────────────────────────────────────────── */}
        <GlassCard className="rounded-[24px] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Weight Log</div>
            {sortedWeightLogs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowWeightHistory((v) => !v)}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-white transition-colors"
              >
                History {showWeightHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {isLoggingWeight ? (
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Today's weight in kg"
                value={draftWeight}
                onChange={(e) => setDraftWeight(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-low px-4 text-white outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoggingWeight(false)}
                  className="flex-1 min-h-11 rounded-full border border-white/8 px-5 py-3 text-sm font-medium text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!draftWeight || isNaN(Number(draftWeight))}
                  onClick={async () => {
                    if (!draftWeight) return;
                    await addWeightLog({ weight: Number(draftWeight) });
                    setDraftWeight("");
                    setIsLoggingWeight(false);
                  }}
                  className="flex-1 min-h-11 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
                >
                  Save weight
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLoggingWeight(true)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#66d9cc,#26a69a)] px-5 py-3 text-sm font-semibold text-[#003430]"
            >
              <Scale className="h-4 w-4" />
              Log Weight
            </button>
          )}

          {showWeightHistory && sortedWeightLogs.length > 0 && (
            <div className="space-y-2 border-t border-white/8 pt-4">
              {sortedWeightLogs.slice(0, 10).map((log) => (
                <div
                  key={log._id}
                  className="group flex items-center justify-between rounded-2xl border border-white/6 bg-black/15 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{log.weight} kg</div>
                    <div className="text-xs text-on-surface-variant">
                      {new Date(log.loggedAt).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {confirmDeleteWeight === log._id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteWeight(null)}
                          className="rounded-lg bg-white/10 px-2 py-1 text-xs text-on-surface-variant"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={deletingWeightId === log._id}
                          onClick={() => handleDeleteWeight(log._id as Id<"weightLogs">)}
                          className="rounded-lg bg-[#ffb3b1]/20 px-2 py-1 text-xs font-semibold text-[#ffb3b1] disabled:opacity-50"
                        >
                          {deletingWeightId === log._id ? "…" : "Delete"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteWeight(log._id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-lg p-1.5 text-on-surface-variant hover:text-[#ffb3b1] transition-all"
                        aria-label="Delete weight log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* ── Primary Objective ────────────────────────────────────────────── */}
        <GlassCard className="rounded-[24px] p-5">
          <div className="mb-4 text-sm font-semibold text-white">Primary Objective</div>
          <div className="grid grid-cols-1 gap-2">
            {primaryObjectives.map((objective) => (
              <button
                key={objective}
                type="button"
                onClick={() => persistUser({ primaryObjective: objective })}
                className={cn(
                  "min-h-11 rounded-2xl border border-white/8 px-4 py-3 text-left text-sm transition-colors",
                  currentUser.primaryObjective === objective
                    ? "bg-primary/12 text-white border-primary/30"
                    : "bg-surface-container-low text-on-surface-variant hover:text-white",
                )}
              >
                {objectiveLabels[objective]}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── Nutrition Targets ────────────────────────────────────────────── */}
        <GlassCard className="space-y-4 rounded-[24px] p-5">
          <div className="text-sm font-semibold text-white">Nutrition Targets</div>
          <EditableNumber
            label="Daily Calorie Target"
            value={currentUser.dailyCalorieTarget ?? 2000}
            suffix="kcal"
            onCommit={(v) => persistUser({ dailyCalorieTarget: v })}
          />
          <EditableNumber
            label="Protein Target"
            value={currentUser.proteinTarget ?? 150}
            suffix="g"
            onCommit={(v) => persistUser({ proteinTarget: v })}
          />
          <EditableNumber
            label="Carbs Target"
            value={currentUser.carbsTarget ?? 250}
            suffix="g"
            onCommit={(v) => persistUser({ carbsTarget: v })}
          />
          <EditableNumber
            label="Fats Target"
            value={currentUser.fatsTarget ?? 70}
            suffix="g"
            onCommit={(v) => persistUser({ fatsTarget: v })}
          />
        </GlassCard>

      </PageTransition>
    </AppChrome>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function StatChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-[18px] bg-surface-container-low px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">{label}</div>
      <div className={cn("mt-1.5 text-base font-bold", highlight ? "text-[#66d9cc]" : "text-white")}>{value}</div>
    </div>
  );
}

function EditableNumber({
  label,
  value,
  suffix,
  onCommit,
}: {
  label: string;
  value: number;
  suffix: string;
  onCommit: (value: number) => Promise<void>;
}) {
  const [localValue, setLocalValue] = useState(String(value));

  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
        <PencilLine className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="relative">
        <input
          key={value}
          type="number"
          defaultValue={value}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={async () => {
            const next = Number(localValue);
            if (!Number.isFinite(next) || next <= 0) return;
            await onCommit(next);
          }}
          className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-low px-4 pr-14 text-white outline-none focus:border-primary/40"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">{suffix}</span>
      </div>
    </label>
  );
}
