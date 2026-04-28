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

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

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
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [
    allowMissingProfile,
    isConvexAuthLoading,
    isConvexAuthenticated,
    isLoaded,
    isSignedIn,
    showFallback,
  ]);

  useEffect(() => {
    if (!isSignedIn || !isConvexAuthenticated || user === undefined) return;
    if (!allowMissingProfile && user === null) {
      router.replace("/onboarding");
    }
    if (allowMissingProfile && user) {
      router.replace("/dashboard");
    }
  }, [allowMissingProfile, isConvexAuthenticated, isSignedIn, router, user]);

  if (
    !isLoaded ||
    !isSignedIn ||
    (allowMissingProfile && isConvexAuthLoading) ||
    (!allowMissingProfile &&
      !showFallback &&
      (isConvexAuthLoading || !isConvexAuthenticated || user === undefined || user === null))
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-on-surface-variant">
        Loading your tracker...
      </div>
    );
  }

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
          <p className="mt-2 text-xs text-on-surface-variant">
            In Clerk Dashboard, either activate the Convex integration or create a JWT template named{" "}
            <span className="font-semibold text-white">convex</span>, then sign out and sign back in.
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
