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
  useQuery(api.users.getUserByClerkId, isSignedIn ? {} : "skip");
  useQuery(api.foodLogs.getFoodLogsByDate, isSignedIn ? { date: today } : "skip");
  useQuery(api.weightLogs.getWeightLogsByUserId, isSignedIn ? {} : "skip");
  useQuery(api.dailySummaries.getDailySummariesByRange, isSignedIn ? { from, to: today } : "skip");
  
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
