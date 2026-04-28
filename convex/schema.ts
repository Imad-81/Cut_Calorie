import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    height: v.number(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    activityLevel: v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
      v.literal("very_active"),
    ),
    primaryObjective: v.union(
      v.literal("fat_loss"),
      v.literal("maintenance"),
      v.literal("muscle_gain"),
    ),
    dailyCalorieTarget: v.number(),
    proteinTarget: v.number(),
    carbsTarget: v.number(),
    fatsTarget: v.number(),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),
  weightLogs: defineTable({
    userId: v.string(),
    weight: v.number(),
    loggedAt: v.number(),
    note: v.optional(v.string()),
  }).index("by_userId_and_loggedAt", ["userId", "loggedAt"]),
  foodLogs: defineTable({
    userId: v.string(),
    date: v.string(),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack"),
    ),
    foodName: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fats: v.number(),
    fiber: v.optional(v.number()),
    servingSize: v.string(),
    imageUrl: v.optional(v.string()),
    loggedViaAI: v.boolean(),
    loggedAt: v.number(),
  })
    .index("by_userId_and_date", ["userId", "date"])
    .index("by_userId_and_loggedAt", ["userId", "loggedAt"])
    .index("by_userId_and_date_and_mealType", ["userId", "date", "mealType"]),
  dailySummaries: defineTable({
    userId: v.string(),
    date: v.string(),
    totalCalories: v.number(),
    totalProtein: v.number(),
    totalCarbs: v.number(),
    totalFats: v.number(),
    calorieTarget: v.number(),
    streak: v.number(),
  }).index("by_userId_and_date", ["userId", "date"]),
});
