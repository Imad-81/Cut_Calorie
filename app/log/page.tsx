"use client";

import { useMutation } from "convex/react";
import { ImagePlus, LoaderCircle, Sparkles, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/convex/_generated/api";
import { mealTypes, mealTypeLabels } from "@/lib/constants";
import type { FoodAnalysisResult } from "@/lib/food-analysis";
import { todayKey } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

import { PageTransition } from "@/components/ui/page-transition";

const MEAL_ICONS: Record<(typeof mealTypes)[number], string> = {
  breakfast: "☀️",
  lunch: "🌤️",
  dinner: "🌙",
  snack: "⚡",
};

const QUICK_FOODS: Array<{ label: string; description: string }> = [
  { label: "🍳 Eggs (2)", description: "2 boiled eggs" },
  { label: "🍚 Rice (1 cup)", description: "1 cup cooked white rice" },
  { label: "🥛 Milk (1 glass)", description: "250ml whole milk" },
  { label: "🍌 Banana", description: "1 medium banana" },
  { label: "🍗 Chicken", description: "100g grilled chicken breast" },
  { label: "🥜 Peanut Butter", description: "1 tbsp peanut butter" },
];

export default function LogPage() {
  return (
    <AuthGuard>
      <LogScreen />
    </AuthGuard>
  );
}

function LogScreen() {
  const router = useRouter();
  const addFoodLog = useMutation(api.foodLogs.addFoodLog);

  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<(typeof mealTypes)[number]>("lunch");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [analysis, setAnalysis] = useState<FoodAnalysisResult | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Can analyse if there is at least a description OR a photo
  const canAnalyze = useMemo(
    () => {
      const hasText = description.trim().length > 0;
      const hasImage = Boolean(imageBase64);
      const isImageLoading = Boolean(imagePreviewUrl && !imageBase64);
      
      if (isImageLoading) return false;
      return hasText || hasImage;
    },
    [description, imageBase64, imagePreviewUrl],
  );

  async function analyzeFood() {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim() || undefined,
          imageBase64: imageBase64 || undefined,
          mimeType,
        }),
      });
      if (!response.ok) throw new Error("Unable to analyze food");
      const result = (await response.json()) as FoodAnalysisResult;
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function confirmLog() {
    if (!analysis || isSaving) return;
    setIsSaving(true);
    try {
      await addFoodLog({
        date: selectedDate,
        mealType,
        foodName: analysis.foodName,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
        fiber: analysis.fiber,
        servingSize: analysis.servingSize,
        imageUrl: undefined,
        loggedViaAI: true,
      });
      router.replace("/dashboard");
    } finally {
      setIsSaving(false);
    }
  }

  function clearImage() {
    setImageBase64(undefined);
    setImagePreviewUrl(undefined);
    setMimeType(undefined);
    setAnalysis(null);
  }

  function reset() {
    setDescription("");
    clearImage();
    setAnalysis(null);
  }

  return (
    <AppChrome title="Log Food" subtitle="Describe it, snap it, or both">
      <PageTransition className="space-y-4 pb-6">

        {/* ── Step 1: Meal type ──────────────────────────────────────────── */}
        <GlassCard className="rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              Step 1 — When did you eat this?
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={todayKey()}
              className="rounded-lg bg-surface-container-high px-2 py-1 text-xs text-white outline-none border border-white/8 focus:border-primary/40 [color-scheme:dark]"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMealType(value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-semibold transition-all",
                  mealType === value
                    ? "border-primary/40 bg-primary/12 text-white shadow-[0_0_16px_rgba(102,217,204,0.12)]"
                    : "border-white/8 bg-surface-container-low text-on-surface-variant hover:border-white/16 hover:text-white",
                )}
              >
                <span className="text-xl leading-none">{MEAL_ICONS[value]}</span>
                {mealTypeLabels[value]}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── Step 2: Describe + Photo ───────────────────────────────────── */}
        <GlassCard className="rounded-[24px] p-4 space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
            Step 2 — What did you eat?
          </div>

          {/* Description textarea */}
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setAnalysis(null); }}
              placeholder="e.g. 2 rotis with dal and sabzi…"
              rows={3}
              className="w-full rounded-[20px] border border-white/8 bg-surface-container-low px-4 py-3 text-sm text-white outline-none placeholder:text-on-surface-variant resize-none focus:border-primary/40 transition-colors pr-9"
            />
            {description.length > 0 && (
              <button
                type="button"
                onClick={() => { setDescription(""); setAnalysis(null); }}
                className="absolute right-3 top-3 rounded-full p-1 text-on-surface-variant hover:text-white transition-colors"
                aria-label="Clear description"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs text-on-surface-variant">and / or</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Photo upload */}
          {imagePreviewUrl ? (
            <div className="relative">
              <Image
                src={imagePreviewUrl}
                alt="Meal photo"
                width={600}
                height={400}
                className="w-full max-h-56 rounded-[18px] object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white backdrop-blur-sm hover:bg-black/90 transition-colors"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/12 bg-surface-container-low py-5 text-center hover:bg-white/4 transition-colors">
              <ImagePlus className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-white">Add a meal photo</div>
                <div className="mt-0.5 text-xs text-on-surface-variant">JPG, PNG, or HEIC</div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImagePreviewUrl(URL.createObjectURL(file));
                  setAnalysis(null);
                  const reader = new FileReader();
                  reader.onload = () => {
                    const value = String(reader.result ?? "");
                    setImageBase64(value.split(",")[1]);
                    setMimeType(file.type);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          )}

          {/* Analyse button */}
          <button
            type="button"
            onPointerDown={(e) => {
              if (!canAnalyze || isAnalyzing) return;
              // Prevent losing focus immediately so mobile keyboards don't collapse and shift the layout
              e.preventDefault();
            }}
            onClick={() => {
              if (!canAnalyze || isAnalyzing) return;
              // Manually blur to close keyboard cleanly without breaking the click event
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              analyzeFood();
            }}
            disabled={!canAnalyze || isAnalyzing}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#66d9cc,#26a69a)] px-5 py-3 text-sm font-semibold text-[#003430] disabled:opacity-40 transition-all relative overflow-hidden"
          >
            {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <Sparkles className="h-4 w-4 shrink-0" />}
            <span className="truncate">
              {isAnalyzing ? "Analysing with AI…" : "Analyse with AI"}
            </span>
          </button>
        </GlassCard>

        {/* ── Quick add chips ────────────────────────────────────────────── */}
        {!analysis && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              <Zap className="h-3.5 w-3.5" />
              Quick Add
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_FOODS.map((food) => (
                <button
                  key={food.label}
                  type="button"
                  onClick={() => { setDescription(food.description); setAnalysis(null); }}
                  className="rounded-full border border-white/8 bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant hover:text-white hover:border-white/20 transition-all"
                >
                  {food.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm result ─────────────────────────────────────── */}
        {analysis && (
          <GlassCard className="space-y-4 rounded-[24px] p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-1">
                  Step 3 — Review &amp; Save
                </div>
                <div className="text-lg font-semibold text-white">{analysis.foodName}</div>
                <div className="text-sm text-on-surface-variant">{analysis.servingSize}</div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-full p-1.5 text-on-surface-variant hover:text-white transition-colors"
                aria-label="Start over"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Macros grid */}
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Calories" value={`${analysis.calories} kcal`} highlight />
              <Metric label="Protein" value={`${analysis.protein} g`} />
              <Metric label="Carbs" value={`${analysis.carbs} g`} />
              <Metric label="Fats" value={`${analysis.fats} g`} />
              {analysis.fiber !== undefined && (
                <Metric label="Fiber" value={`${analysis.fiber} g`} />
              )}
            </div>

            {/* Meal type reminder pill */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-surface-container-low px-3 py-2.5">
              <span className="text-lg">{MEAL_ICONS[mealType]}</span>
              <div className="flex-1">
                <div className="text-xs text-on-surface-variant">Logging as</div>
                <div className="text-sm font-semibold text-white">{mealTypeLabels[mealType]}</div>
              </div>
              <div className="flex gap-1.5">
                {mealTypes.filter((m) => m !== mealType).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealType(m)}
                    className="rounded-xl border border-white/8 bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant hover:text-white transition-colors"
                    title={mealTypeLabels[m]}
                  >
                    {MEAL_ICONS[m]}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={confirmLog}
              disabled={isSaving}
              className="min-h-12 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-70 transition-opacity"
            >
              {isSaving ? "Saving…" : "✓ Confirm and save"}
            </button>
          </GlassCard>
        )}
      </PageTransition>
    </AppChrome>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface-container-low px-3 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{label}</div>
      <div className={cn("mt-2 font-semibold", highlight ? "text-[#66d9cc]" : "text-white")}>{value}</div>
    </div>
  );
}
