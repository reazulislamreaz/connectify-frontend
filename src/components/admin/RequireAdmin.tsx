"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { ADMIN_USE_MOCK } from "@/hooks/adminQueries";

const STAFF_ROLES = ["admin", "moderator"] as const;

export function isStaff(role?: string): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

/**
 * Role gate for /admin. The real security boundary is the backend's
 * requireRole middleware — this only keeps non-staff out of the UI.
 *
 * While ADMIN_USE_MOCK is true the backend has no role field yet, so any
 * logged-in user may view the dashboard for the demo. Once the backend ships
 * roles, flip ADMIN_USE_MOCK off and this enforces user.role for real.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = ADMIN_USE_MOCK ? !!user : isStaff(user?.role);

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace("/dashboard");
    }
  }, [loading, allowed, router]);

  if (loading) return <AppLoadingScreen />;
  if (!allowed) return null;
  return <>{children}</>;
}
