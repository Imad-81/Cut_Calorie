import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireCurrentUser, getCurrentUser } from "./lib";

async function recomputeDailySummary(
  ctx: MutationCtx,
  user: {
    clerkId: string;
    dailyCalorieTarget?: number;
  },
  date: string,
) {
  const calorieTarget = user.dailyCalorieTarget ?? 2000; // Fallback to 2000 if not set
  const logs = await ctx.db
    .query("foodLogs")
    .withIndex("by_userId_and_date", (q) =>
      q.eq("userId", user.clerkId).eq("date", date),
    )
    .take(64);
  const existing = await ctx.db
    .query("dailySummaries")
    .withIndex("by_userId_and_date", (q) =>
      q.eq("userId", user.clerkId).eq("date", date),
    )
    .unique();
  const previousDate = new Date(`${date}T00:00:00Z`);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);
  const previousKey = previousDate.toISOString().slice(0, 10);
  const previous = await ctx.db
    .query("dailySummaries")
    .withIndex("by_userId_and_date", (q) =>
      q.eq("userId", user.clerkId).eq("date", previousKey),
    )
    .unique();
  const totals = logs.reduce(
    (acc, log) => {
      acc.totalCalories += log.calories;
      acc.totalProtein += log.protein;
      acc.totalCarbs += log.carbs;
      acc.totalFats += log.fats;
      return acc;
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 },
  );
  const streak = totals.totalCalories > 0 ? (previous?.streak ?? 0) + 1 : 0;
  if (existing) {
    await ctx.db.patch(existing._id, {
      ...totals,
      calorieTarget: calorieTarget,
      streak,
    });
    return;
  }
  await ctx.db.insert("dailySummaries", {
    userId: user.clerkId,
    date,
    ...totals,
    calorieTarget: calorieTarget,
    streak,
  });
}

export const upsertDailySummary = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await recomputeDailySummary(ctx, user, args.date);
    return true;
  },
});

export const getDailySummariesByRange = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("dailySummaries")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", user.clerkId).gte("date", args.from).lte("date", args.to),
      )
      .take(60);
  },
});

export { recomputeDailySummary };
