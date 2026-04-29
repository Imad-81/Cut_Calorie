import {
  activityLevels,
  genders,
  primaryObjectives,
} from "@/lib/constants";

export type ActivityLevel = (typeof activityLevels)[number];
export type Gender = (typeof genders)[number];
export type PrimaryObjective = (typeof primaryObjectives)[number];

const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBmr(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
}) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  if (input.gender === "male") return base + 5;
  if (input.gender === "female") return base - 161;
  return base - 78;
}

export function calculateDailyTarget(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  primaryObjective: PrimaryObjective;
}) {
  const bmr = calculateBmr(input);
  const tdee = bmr * activityFactors[input.activityLevel];
  if (input.primaryObjective === "fat_loss") return Math.round(tdee - 400);
  if (input.primaryObjective === "muscle_gain") return Math.round(tdee + 250);
  return Math.round(tdee);
}

export function deriveMacroTargets(
  calories: number,
  primaryObjective: PrimaryObjective,
) {
  if (primaryObjective === "fat_loss") {
    return {
      proteinTarget: Math.round((calories * 0.35) / 4),
      carbsTarget: Math.round((calories * 0.35) / 4),
      fatsTarget: Math.round((calories * 0.3) / 9),
    };
  }
  if (primaryObjective === "muscle_gain") {
    return {
      proteinTarget: Math.round((calories * 0.3) / 4),
      carbsTarget: Math.round((calories * 0.45) / 4),
      fatsTarget: Math.round((calories * 0.25) / 9),
    };
  }
  return {
    proteinTarget: Math.round((calories * 0.3) / 4),
    carbsTarget: Math.round((calories * 0.4) / 4),
    fatsTarget: Math.round((calories * 0.3) / 9),
  };
}

export function calculateBmi(weightKg?: number | null, heightCm?: number) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBmiCategory(bmi?: number | null) {
  if (!bmi) return "Unknown";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function formatDateLabel(date: Date, options?: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...options }).format(date);
  } catch (e) {
    // Fallback if timezone or options are unsupported
    return date.toLocaleDateString(undefined, options);
  }
}

export function todayKey() {
  try {
    const d = new Date();
    const str = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
    // str is typically "MM/DD/YYYY"
    const parts = str.split("/");
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Fallback if formatting was weird
    return d.toISOString().slice(0, 10);
  } catch (e) {
    // Fallback to local date if timezone is unsupported
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function shiftDate(dateKey: string, amount: number) {
  try {
    const parts = dateKey.split(/[-/]/); // handle both '-' and '/'
    if (parts.length === 3) {
      // Assuming YYYY-MM-DD or similar if first part is 4 digits
      let year = Number(parts[0]);
      let month = Number(parts[1]);
      let day = Number(parts[2]);
      if (year < 1000) {
        // Might be MM/DD/YYYY fallback
        year = Number(parts[2]);
        month = Number(parts[0]);
        day = Number(parts[1]);
      }
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + amount);
      return date.toISOString().slice(0, 10);
    }
    return dateKey;
  } catch (e) {
    return dateKey;
  }
}
