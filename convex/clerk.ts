import { Webhook } from "svix";
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const handleClerkWebhook = internalAction({
  args: {
    payload: v.string(),
    headers: v.object({
      svixId: v.string(),
      svixTimestamp: v.string(),
      svixSignature: v.string(),
    }),
  },
  handler: async (ctx, { payload, headers }) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SECRET is not set");
    }

    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(payload, {
        "svix-id": headers.svixId,
        "svix-timestamp": headers.svixTimestamp,
        "svix-signature": headers.svixSignature,
      }) as any;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      throw new Error("Invalid webhook signature");
    }

    const { type, data } = evt;

    switch (type) {
      case "user.created":
      case "user.updated": {
        const email = data.email_addresses[0]?.email_address;
        const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User";
        const avatarUrl = data.image_url;
        const clerkId = data.id;

        // Construct tokenIdentifier
        // For Clerk, it's usually https://<domain>|<clerk_id>
        const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
        if (!issuer) {
          throw new Error("CLERK_JWT_ISSUER_DOMAIN is not set");
        }
        const tokenIdentifier = `${issuer}|${clerkId}`;

        await ctx.runMutation((internal as any).clerk.upsertUserFromClerk, {
          clerkId,
          tokenIdentifier,
          name,
          email,
          avatarUrl,
        });
        break;
      }
      case "user.deleted": {
        const clerkId = data.id;
        await ctx.runMutation((internal as any).clerk.deleteUserFromClerk, { clerkId });
        break;
      }
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }
  },
});

export const upsertUserFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        tokenIdentifier: args.tokenIdentifier,
      });
    } else {
      await ctx.db.insert("users", {
        clerkId: args.clerkId,
        tokenIdentifier: args.tokenIdentifier,
        name: args.name,
        email: args.email,
        avatarUrl: args.avatarUrl,
        createdAt: Date.now(),
        // Health fields are optional in schema now
      });
    }
  },
});

export const deleteUserFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      
      // Optionally delete related data
      const weightLogs = await ctx.db
        .query("weightLogs")
        .withIndex("by_userId_and_loggedAt", (q) => q.eq("userId", clerkId))
        .collect();
      for (const log of weightLogs) {
        await ctx.db.delete(log._id);
      }

      const foodLogs = await ctx.db
        .query("foodLogs")
        .withIndex("by_userId_and_date", (q) => q.eq("userId", clerkId))
        .collect();
      for (const log of foodLogs) {
        await ctx.db.delete(log._id);
      }

      const dailySummaries = await ctx.db
        .query("dailySummaries")
        .withIndex("by_userId_and_date", (q) => q.eq("userId", clerkId))
        .collect();
      for (const summary of dailySummaries) {
        await ctx.db.delete(summary._id);
      }
    }
  },
});
