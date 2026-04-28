"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { ArrowRight, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { PageTransition } from "@/components/ui/page-transition";
import { api } from "@/convex/_generated/api";
import {
  activityLabels,
  activityLevels,
  genders,
  objectiveLabels,
  primaryObjectives,
} from "@/lib/constants";
import { calculateDailyTarget, deriveMacroTargets } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  return (
    <AuthGuard allowMissingProfile>
      <OnboardingScreen />
    </AuthGuard>
  );
}

function OnboardingScreen() {
  const router = useRouter();
  const { user } = useUser();
  const {
    isAuthenticated: isConvexAuthenticated,
    isLoading: isConvexAuthLoading,
  } = useConvexAuth();
  const saveUser = useMutation(api.users.createOrUpdateUser);
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    height: 170,
    weight: 70,
    age: 28,
    gender: "male" as (typeof genders)[number],
    activityLevel: "moderate" as (typeof activityLevels)[number],
    primaryObjective: "fat_loss" as (typeof primaryObjectives)[number],
  });

  const target = useMemo(
    () =>
      calculateDailyTarget({
        weightKg: form.weight,
        heightCm: form.height,
        age: form.age,
        gender: form.gender,
        activityLevel: form.activityLevel,
        primaryObjective: form.primaryObjective,
      }),
    [form],
  );
  const macros = useMemo(
    () => deriveMacroTargets(target, form.primaryObjective),
    [target, form.primaryObjective],
  );

  async function handleSubmit() {
    if (!user || !isConvexAuthenticated || isConvexAuthLoading || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await saveUser({
        name: user.fullName ?? "CUT",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        avatarUrl: user.imageUrl,
        height: form.height,
        age: form.age,
        gender: form.gender,
        activityLevel: form.activityLevel,
        primaryObjective: form.primaryObjective,
        dailyCalorieTarget: target,
        ...macros,
        currentWeightKg: form.weight,
      });
      router.replace("/dashboard");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppChrome title="Welcome" subtitle="Let’s tune your baseline" hideNav>
      <PageTransition className="space-y-4">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={cn(
                  "h-2 flex-1 rounded-full bg-white/8",
                  index <= step && "bg-[linear-gradient(90deg,#66d9cc,#26a69a)]",
                )}
              />
            ))}
          </div>
          {step === 0 ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold tracking-tight text-white">Your health baseline</h1>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Height (cm)" value={form.height} onChange={(value) => setForm((current) => ({ ...current, height: value }))} />
                <NumberField label="Weight (kg)" value={form.weight} onChange={(value) => setForm((current) => ({ ...current, weight: value }))} />
                <NumberField label="Age" value={form.age} onChange={(value) => setForm((current) => ({ ...current, age: value }))} />
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as (typeof genders)[number] }))}
                    className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-low px-4 text-white outline-none"
                  >
                    {genders.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}
          {step === 1 ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold tracking-tight text-white">How active are you?</h1>
              {activityLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, activityLevel: level }))}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[18px] border border-white/8 px-4 py-4 text-left",
                    form.activityLevel === level ? "bg-primary/12 text-white" : "bg-surface-container-low text-on-surface-variant",
                  )}
                >
                  <span>{activityLabels[level]}</span>
                  {form.activityLevel === level ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              ))}
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold tracking-tight text-white">What’s the goal?</h1>
              {primaryObjectives.map((objective) => (
                <button
                  key={objective}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, primaryObjective: objective }))}
                  className={cn(
                    "w-full rounded-[18px] border border-white/8 px-4 py-4 text-left",
                    form.primaryObjective === objective ? "bg-primary/12 text-white" : "bg-surface-container-low text-on-surface-variant",
                  )}
                >
                  <div className="font-medium">{objectiveLabels[objective]}</div>
                  <div className="mt-1 text-sm">Target: {target} kcal/day</div>
                </button>
              ))}
              <GlassCard className="bg-surface-container-low/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Suggested targets</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>{target} kcal</div>
                  <div>{macros.proteinTarget}g protein</div>
                  <div>{macros.carbsTarget}g carbs</div>
                  <div>{macros.fatsTarget}g fats</div>
                </div>
              </GlassCard>
            </div>
          ) : null}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="text-sm text-on-surface-variant disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => (step === 2 ? handleSubmit() : setStep((current) => current + 1))}
              disabled={
                (step === 2 && (!isConvexAuthenticated || isConvexAuthLoading || isSaving)) ||
                (step !== 2 && isSaving)
              }
              className="flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#66d9cc,#26a69a)] px-5 py-3 text-sm font-semibold text-[#003430]"
            >
              {step === 2 ? (isSaving ? "Saving..." : "Finish setup") : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </GlassCard>
      </PageTransition>
    </AppChrome>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-2xl border border-white/8 bg-surface-container-low px-4 text-white outline-none"
      />
    </div>
  );
}
