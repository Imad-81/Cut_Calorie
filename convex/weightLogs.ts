import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCurrentUser } from "./lib";

export const addWeightLog = mutation({
  args: { weight: v.number(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await ctx.db.insert("weightLogs", {
      userId: user.clerkId,
      weight: args.weight,
      note: args.note,
      loggedAt: Date.now(),
    });
    return true;
  },
});

export const getWeightLogsByUserId = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireCurrentUser(ctx);
    const now = Date.now();
    const from = now - 1000 * 60 * 60 * 24 * 7 * 12;
    return await ctx.db
      .query("weightLogs")
      .withIndex("by_userId_and_loggedAt", (q) =>
        q.eq("userId", user.clerkId).gte("loggedAt", from).lte("loggedAt", now),
      )
      .take(100);
  },
});

export const getLatestWeight = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireCurrentUser(ctx);
    return await ctx.db
      .query("weightLogs")
      .withIndex("by_userId_and_loggedAt", (q) => q.eq("userId", user.clerkId))
      .order("desc")
      .first();
  },
});
