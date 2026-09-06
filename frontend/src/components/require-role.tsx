"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/lib/queries";
import type { Role, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export const loginPathFor: Record<Role, string> = {
  patient: "/login",
  doctor: "/doctor/login",
  admin: "/admin/login",
};

export const homePathFor: Record<Role, string> = {
  patient: "/visits",
  doctor: "/doctor",
  admin: "/admin",
};

/**
 * Client side gate for an area. The server still decides every request; this only
 * sends people to the right sign in page, or to their own area, without a flash of
 * someone else's screen. A patient with no name yet is sent to complete their details.
 */
export function RequireRole({ role, children }: { role: Role; children: (user: User) => React.ReactNode }) {
  const { data: user, isPending, isError } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      router.replace(`${loginPathFor[role]}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user.role !== role) {
      router.replace(homePathFor[user.role]);
      return;
    }
    if (role === "patient" && !user.profile_complete && pathname !== "/account") {
      router.replace(`/account?next=${encodeURIComponent(pathname)}`);
    }
  }, [isPending, user, role, router, pathname]);

  if (isPending || isError || !user || user.role !== role) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 p-6" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return <>{children(user)}</>;
}
