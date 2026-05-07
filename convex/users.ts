import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib";

// Lightweight upsert called from the client when getUserByClerkId returns null.
// Creates a minimal user row using the Clerk JWT identity — no webhook needed.
export const ensureUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
    });
  },
});

export const getUserByClerkId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

export const createOrUpdateUser = mutation({
  args: {
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
    currentWeightKg: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    const nextUser = {
      clerkId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      name: args.name,
      email: args.email,
      avatarUrl: args.avatarUrl,
      height: args.height,
      age: args.age,
      gender: args.gender,
      activityLevel: args.activityLevel,
      primaryObjective: args.primaryObjective,
      dailyCalorieTarget: args.dailyCalorieTarget,
      proteinTarget: args.proteinTarget,
      carbsTarget: args.carbsTarget,
      fatsTarget: args.fatsTarget,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    let clerkId = identity.subject;
    if (existing) {
      clerkId = existing.clerkId;
      await ctx.db.patch(existing._id, nextUser);
    } else {
      await ctx.db.insert("users", nextUser);
    }
    if (args.currentWeightKg !== undefined) {
      const existingWeight = await ctx.db
        .query("weightLogs")
        .withIndex("by_userId_and_loggedAt", (q) => q.eq("userId", clerkId))
        .first();
      
      if (!existingWeight) {
        await ctx.db.insert("weightLogs", {
          userId: clerkId,
          weight: args.currentWeightKg,
          loggedAt: Date.now(),
        });
      }
    }
    return clerkId;
  },
});
