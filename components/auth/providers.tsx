"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { shiftDate, todayKey } from "@/lib/nutrition";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function DataRetainer() {
  const { isSignedIn } = useAuth();
  const today = todayKey();
  const from = shiftDate(today, -6);
  
  // Retain critical data in cache so page transitions are always instant
  const user = useQuery(api.users.getUserByClerkId, isSignedIn ? {} : "skip");
  const hasProfile = !!user;

  useQuery(api.foodLogs.getFoodLogsByDate, isSignedIn && hasProfile ? { date: today } : "skip");
  useQuery(api.weightLogs.getWeightLogsByUserId, isSignedIn && hasProfile ? {} : "skip");
  useQuery(api.dailySummaries.getDailySummariesByRange, isSignedIn && hasProfile ? { from, to: today } : "skip");
  
  return null;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <DataRetainer />
      {children}
    </ConvexProviderWithClerk>
  );
}
