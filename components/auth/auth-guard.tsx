"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";

export function AuthGuard({
  children,
  allowMissingProfile = false,
}: {
  children: React.ReactNode;
  allowMissingProfile?: boolean;
}) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const {
    isAuthenticated: isConvexAuthenticated,
    isLoading: isConvexAuthLoading,
  } = useConvexAuth();
  const [showFallback, setShowFallback] = useState(false);
  const user = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && isConvexAuthenticated ? {} : "skip",
  );

  // 1. Immediate redirect on sign out to avoid "stuck" loading screen
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.assign("/sign-in");
    }
  }, [isLoaded, isSignedIn]);

  // 2. Fallback timeout for Convex auth issues
  useEffect(() => {
    if (
      !isLoaded ||
      !isSignedIn ||
      isConvexAuthLoading ||
      isConvexAuthenticated ||
      allowMissingProfile ||
      showFallback
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setShowFallback(true);
    }, 3000); // Slightly faster fallback
    return () => window.clearTimeout(timeout);
  }, [
    allowMissingProfile,
    isConvexAuthLoading,
    isConvexAuthenticated,
    isLoaded,
    isSignedIn,
    showFallback,
  ]);

  // 3. Onboarding / Dashboard redirection logic
  useEffect(() => {
    // Only redirect if we have both Clerk and Convex auth + user data
    if (!isSignedIn || !isConvexAuthenticated || user === undefined) return;
    
    // Check if onboarding is complete (health data exists)
    const isProfileComplete = !!(user && user.height && user.dailyCalorieTarget);

    if (!allowMissingProfile && !isProfileComplete) {
      router.replace("/onboarding");
    } else if (allowMissingProfile && isProfileComplete) {
      router.replace("/dashboard");
    }
  }, [allowMissingProfile, isConvexAuthenticated, isSignedIn, router, user]);

  // Handle loading states
  if (!isLoaded || !isSignedIn) {
    return null; // Let the useEffect handle the redirect to sign-in
  }

  // If we are authenticated but waiting for user data from Convex (e.g. webhook delay)
  if (isConvexAuthenticated && user === null) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <div className="text-sm font-medium text-white">Setting up your profile...</div>
        <p className="mt-2 text-xs text-on-surface-variant">This should only take a moment.</p>
      </div>
    );
  }

  // Show loading while auth or user data is initializing
  if (
    (allowMissingProfile && isConvexAuthLoading) ||
    (!allowMissingProfile &&
      !showFallback &&
      (isConvexAuthLoading || !isConvexAuthenticated || user === undefined))
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-on-surface-variant">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your tracker...
        </div>
      </div>
    );
  }

  // Show fallback if Convex auth fails to connect
  if (
    !allowMissingProfile &&
    showFallback &&
    !isConvexAuthLoading &&
    !isConvexAuthenticated
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="glass-panel w-full max-w-sm rounded-[24px] p-6 text-center">
          <div className="text-lg font-semibold text-white">Connection check needed</div>
          <p className="mt-2 text-sm text-on-surface-variant">
            Clerk signed in, but Convex could not get a valid auth token for this session.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-full bg-[linear-gradient(135deg,#66d9cc,#26a69a)] px-4 py-3 text-sm font-semibold text-[#003430]"
            >
              Retry session
            </button>
            <SignOutButton>
              <button
                type="button"
                className="min-h-11 rounded-full border border-white/10 px-4 py-3 text-sm font-medium text-white"
              >
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

