export type FoodAnalysisResult = {
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
};

export function parseFoodAnalysis(text: string): FoodAnalysisResult {
  const normalized = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(normalized) as FoodAnalysisResult;
  return {
    foodName: parsed.foodName,
    servingSize: parsed.servingSize,
    calories: Number(parsed.calories ?? 0),
    protein: Number(parsed.protein ?? 0),
    carbs: Number(parsed.carbs ?? 0),
    fats: Number(parsed.fats ?? 0),
    fiber: parsed.fiber === undefined ? undefined : Number(parsed.fiber),
  };
}
