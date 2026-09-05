"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Loads the signed in user from the API and sends anyone with the wrong role to the sign in
 * page for this area. Returns { user, loading, setUser, logout }.
 */
export default function useAuthUser(role, loginPath, { skip = false } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const router = useRouter();

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, { credentials: "include", headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("unauthenticated");
        const data = await res.json();
        if (cancelled) return;
        if (data.user?.role === role) setUser(data.user);
        else router.push(loginPath);
      } catch {
        if (!cancelled) router.push(loginPath);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [role, loginPath, skip, router]);

  const logout = async () => {
    try { await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, { method: "POST", credentials: "include" }); } catch { /* signed out either way */ }
    router.push(role === "patient" ? "/" : loginPath);
  };

  return { user, setUser, loading, logout };
}
