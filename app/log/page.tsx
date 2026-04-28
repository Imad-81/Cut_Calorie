"use client";

import { useMutation } from "convex/react";
import { ImagePlus, LoaderCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppChrome } from "@/components/layout/app-chrome";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/convex/_generated/api";
import { mealTypes, mealTypeLabels } from "@/lib/constants";
import type { FoodAnalysisResult } from "@/lib/food-analysis";
import { todayKey } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

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
  const [mode, setMode] = useState<"describe" | "photo">("describe");
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<(typeof mealTypes)[number]>("lunch");
  const [analysis, setAnalysis] = useState<FoodAnalysisResult | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const canAnalyze = useMemo(
    () => (mode === "describe" ? description.trim().length > 0 : Boolean(imageBase64)),
    [description, imageBase64, mode],
  );

  async function analyzeFood() {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: mode === "describe" ? description : undefined,
          imageBase64: mode === "photo" ? imageBase64 : undefined,
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
    if (!analysis) return;
    await addFoodLog({
      date: todayKey(),
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
  }

  return (
    <AppChrome title="Log Food" subtitle="Describe it or snap it">
      <div className="space-y-4">
        <GlassCard className="space-y-4 rounded-[24px] p-4">
          <div className="flex rounded-full bg-surface-container-low p-1">
            {(["describe", "photo"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "min-h-11 flex-1 rounded-full px-4 py-2 text-sm font-medium",
                  mode === value ? "bg-surface-container-high text-white" : "text-on-surface-variant",
                )}
              >
                {value === "describe" ? "Describe" : "Photo"}
              </button>
            ))}
          </div>

          {mode === "describe" ? (
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="2 rotis with dal and sabzi"
              className="min-h-32 w-full rounded-[20px] border border-white/8 bg-surface-container-low px-4 py-4 text-white outline-none placeholder:text-on-surface-variant"
            />
          ) : (
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-white/12 bg-surface-container-low px-4 text-center">
              <ImagePlus className="mb-3 h-6 w-6 text-primary" />
              <span className="text-sm text-white">Upload a meal photo</span>
              <span className="mt-1 text-xs text-on-surface-variant">JPG, PNG, or HEIC</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
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

          <button
            type="button"
            onClick={analyzeFood}
            disabled={!canAnalyze || isAnalyzing}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#66d9cc,#26a69a)] px-5 py-3 text-sm font-semibold text-[#003430] disabled:opacity-50"
          >
            {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze with Gemini
          </button>
        </GlassCard>

        {analysis ? (
          <GlassCard className="space-y-4 rounded-[24px] p-4">
            <div>
              <div className="text-lg font-semibold text-white">{analysis.foodName}</div>
              <div className="text-sm text-on-surface-variant">{analysis.servingSize}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Calories" value={`${analysis.calories} kcal`} />
              <Metric label="Protein" value={`${analysis.protein} g`} />
              <Metric label="Carbs" value={`${analysis.carbs} g`} />
              <Metric label="Fats" value={`${analysis.fats} g`} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mealTypes.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMealType(value)}
                  className={cn(
                    "min-h-11 rounded-2xl border border-white/8 px-3 py-3 text-sm",
                    mealType === value ? "bg-primary/12 text-white" : "bg-surface-container-low text-on-surface-variant",
                  )}
                >
                  {mealTypeLabels[value]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={confirmLog}
              className="min-h-11 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Confirm and save
            </button>
          </GlassCard>
        ) : null}
      </div>
    </AppChrome>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low px-3 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{label}</div>
      <div className="mt-2 font-semibold text-white">{value}</div>
    </div>
  );
}
