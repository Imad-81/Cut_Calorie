"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { PencilLine, Scale } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/ui/page-transition";
import { api } from "@/convex/_generated/api";
import { objectiveLabels, primaryObjectives } from "@/lib/constants";
import { calculateBmi, getBmiCategory } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileScreen />
    </AuthGuard>
  );
}

function ProfileScreen() {
  const { user: clerkUser } = useUser();
  const user = useQuery(api.users.getUserByClerkId, {});
  const latestWeight = useQuery(api.weightLogs.getLatestWeight, {});
  const saveUser = useMutation(api.users.createOrUpdateUser);
  const addWeightLog = useMutation(api.weightLogs.addWeightLog);
  const [draftWeight, setDraftWeight] = useState("");
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);

  const bmi = useMemo(() => calculateBmi(latestWeight?.weight, user?.height), [latestWeight?.weight, user?.height]);
  const bmiPercent = bmi ? Math.max(0, Math.min(100, ((bmi - 15) / 20) * 100)) : 0;

  if (!user || !clerkUser) return null;
  const currentUser = user;
  const currentClerkUser = clerkUser;

  async function persistUser(next: {
    dailyCalorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatsTarget: number;
    primaryObjective: (typeof primaryObjectives)[number];
  }) {
    await saveUser({
      name: currentClerkUser.fullName ?? currentUser.name,
      email: currentClerkUser.primaryEmailAddress?.emailAddress ?? currentUser.email,
      avatarUrl: currentClerkUser.imageUrl ?? currentUser.avatarUrl,
      height: currentUser.height,
      age: currentUser.age,
      gender: currentUser.gender,
      activityLevel: currentUser.activityLevel,
      primaryObjective: next.primaryObjective,
      dailyCalorieTarget: next.dailyCalorieTarget,
      proteinTarget: next.proteinTarget,
      carbsTarget: next.carbsTarget,
      fatsTarget: next.fatsTarget,
    });
  }

  return (
    <AppChrome title="Health Profile" subtitle={currentClerkUser.primaryEmailAddress?.emailAddress}>
      <PageTransition className="space-y-4">
        <GlassCard className="rounded-[24px] p-5">
          <div className="flex items-center gap-4">
            <Image src={currentClerkUser.imageUrl} alt={currentUser.name} width={64} height={64} className="h-16 w-16 rounded-full object-cover" unoptimized />
            <div>
              <div className="text-xl font-semibold text-white">{currentUser.name}</div>
              <div className="text-sm text-on-surface-variant">{currentUser.email}</div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Height" value={`${currentUser.height} cm`} />
          <StatCard label="Current Weight" value={latestWeight ? `${latestWeight.weight} kg` : "--"} />
          <StatCard label="BMI" value={bmi ? `${bmi}` : "--"} />
          <StatCard label="Status" value={getBmiCategory(bmi)} />
        </div>

        <GlassCard className="rounded-[24px] p-5">
          <div className="text-sm font-semibold text-white">BMI Indicator</div>
          <div className="mt-4 h-2 rounded-full bg-[linear-gradient(90deg,#ffb954_0_25%,#66d9cc_25%_60%,#ffb3b1_60%_100%)]" />
          <div className="relative mt-2 h-5">
            <div
              className="absolute top-0 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-black transition-all"
              style={{ left: `${bmiPercent}%` }}
            />
          </div>
        </GlassCard>

        <GlassCard className="rounded-[24px] p-5">
          <div className="mb-4 text-sm font-semibold text-white">Primary Objective</div>
          <div className="grid grid-cols-1 gap-2">
            {primaryObjectives.map((objective) => (
              <button
                key={objective}
                type="button"
                onClick={async () => {
                  const next = {
                    dailyCalorieTarget: user.dailyCalorieTarget,
                    proteinTarget: user.proteinTarget,
                    carbsTarget: user.carbsTarget,
                    fatsTarget: user.fatsTarget,
                    primaryObjective: objective,
                  };
                  await persistUser(next);
                }}
                className={cn(
                  "min-h-11 rounded-2xl border border-white/8 px-4 py-3 text-left text-sm",
                  currentUser.primaryObjective === objective ? "bg-primary/12 text-white" : "bg-surface-container-low text-on-surface-variant",
                )}
              >
                {objectiveLabels[objective]}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="space-y-4 rounded-[24px] p-5">
          <EditableNumber
            label="Daily Calorie Target"
            value={currentUser.dailyCalorieTarget}
            suffix="kcal"
            onCommit={async (value) => {
              const next = {
                dailyCalorieTarget: value,
                proteinTarget: currentUser.proteinTarget,
                carbsTarget: currentUser.carbsTarget,
                fatsTarget: currentUser.fatsTarget,
                primaryObjective: currentUser.primaryObjective,
              };
              await persistUser(next);
            }}
          />
          <EditableNumber
            label="Protein Target"
            value={currentUser.proteinTarget}
            suffix="g"
            onCommit={async (value) => {
              const next = {
                dailyCalorieTarget: currentUser.dailyCalorieTarget,
                proteinTarget: value,
                carbsTarget: currentUser.carbsTarget,
                fatsTarget: currentUser.fatsTarget,
                primaryObjective: currentUser.primaryObjective,
              };
              await persistUser(next);
            }}
          />
          <EditableNumber
            label="Carbs Target"
            value={currentUser.carbsTarget}
            suffix="g"
            onCommit={async (value) => {
              const next = {
                dailyCalorieTarget: currentUser.dailyCalorieTarget,
                proteinTarget: currentUser.proteinTarget,
                carbsTarget: value,
                fatsTarget: currentUser.fatsTarget,
                primaryObjective: currentUser.primaryObjective,
              };
              await persistUser(next);
            }}
          />
          <EditableNumber
            label="Fats Target"
            value={currentUser.fatsTarget}
            suffix="g"
            onCommit={async (value) => {
              const next = {
                dailyCalorieTarget: currentUser.dailyCalorieTarget,
                proteinTarget: currentUser.proteinTarget,
                carbsTarget: currentUser.carbsTarget,
                fatsTarget: value,
                primaryObjective: currentUser.primaryObjective,
              };
              await persistUser(next);
            }}
          />
        </GlassCard>

        <GlassCard className="rounded-[24px] p-5">
          {isLoggingWeight ? (
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Today's weight in kg"
                value={draftWeight}
                onChange={(event) => setDraftWeight(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-low px-4 text-white outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  await addWeightLog({ weight: Number(draftWeight) });
                  setDraftWeight("");
                  setIsLoggingWeight(false);
                }}
                className="min-h-11 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
              >
                Save weight
              </button>
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
        </GlassCard>
      </PageTransition>
    </AppChrome>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="rounded-[20px] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{label}</div>
      <div className="mt-2 text-xl font-bold text-white">{value}</div>
    </GlassCard>
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
          onChange={(event) => setLocalValue(event.target.value)}
          onBlur={async () => {
            const next = Number(localValue);
            if (!Number.isFinite(next)) return;
            await onCommit(next);
          }}
          className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-low px-4 pr-14 text-white outline-none"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">{suffix}</span>
      </div>
    </label>
  );
}
