export const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
export const activityLevels = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const;
export const primaryObjectives = [
  "fat_loss",
  "maintenance",
  "muscle_gain",
] as const;
export const genders = ["male", "female", "other"] as const;

export const mealTypeLabels: Record<(typeof mealTypes)[number], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const objectiveLabels: Record<
  (typeof primaryObjectives)[number],
  string
> = {
  fat_loss: "Fat Loss",
  maintenance: "Maintenance",
  muscle_gain: "Muscle Gain",
};

export const activityLabels: Record<
  (typeof activityLevels)[number],
  string
> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Active",
  very_active: "Very active",
};
