import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCurrentUser, getCurrentUser } from "./lib";

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
    const user = await getCurrentUser(ctx);
    if (!user) return [];
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

export const deleteWeightLog = mutation({
  args: { weightLogId: v.id("weightLogs") },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const log = await ctx.db.get(args.weightLogId);
    if (!log || log.userId !== user.clerkId) {
      throw new Error("Weight log not found");
    }
    await ctx.db.delete(args.weightLogId);
    return true;
  },
});

export const getLatestWeight = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return await ctx.db
      .query("weightLogs")
      .withIndex("by_userId_and_loggedAt", (q) => q.eq("userId", user.clerkId))
      .order("desc")
      .first();
  },
});
