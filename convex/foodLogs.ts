import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCurrentUser, getCurrentUser } from "./lib";
import { recomputeDailySummary } from "./dailySummaries";

export const addFoodLog = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await ctx.db.insert("foodLogs", {
      userId: user.clerkId,
      loggedAt: Date.now(),
      ...args,
    });
    await recomputeDailySummary(ctx, user, args.date);
    return true;
  },
});

export const getFoodLogsByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("foodLogs")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", user.clerkId).eq("date", args.date),
      )
      .take(64);
  },
});

export const getFoodLogsByDateRange = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("foodLogs")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", user.clerkId).gte("date", args.from).lte("date", args.to),
      )
      .take(300);
  },
});

export const deleteFoodLog = mutation({
  args: { foodLogId: v.id("foodLogs") },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const log = await ctx.db.get(args.foodLogId);
    if (!log || log.userId !== user.clerkId) {
      throw new Error("Food log not found");
    }
    await ctx.db.delete(args.foodLogId);
    await recomputeDailySummary(ctx, user, log.date);
    return true;
  },
});
