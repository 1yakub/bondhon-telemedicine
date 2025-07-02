"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't check auth for login page
    if (pathname === "/admin/login") {
      setAuthLoading(false);
      return;
    }

    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.user.role === "admin") {
          setAdmin(data.user);
        } else {
          router.push("/admin/login");
        }
      } else {
        router.push("/admin/login");
      }
    } catch (err) {
      router.push("/admin/login");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/admin/login");
    } catch (err) {
      router.push("/admin/login");
    }
  };

  // For login page, render without layout
  if (pathname === "/admin/login") {
    return children;
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!admin) {
    return null;
  }

  // Get current page for navigation highlighting
  const isActivePage = (path) => {
    if (path === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/admin/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Bondhon</h1>
              <span className="ml-2 text-sm text-gray-500">বন্ধন</span>
              <span className="ml-4 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                Admin
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActivePage("/admin/dashboard")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/doctors"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActivePage("/admin/doctors")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                Doctors
              </Link>
              <Link
                href="/admin/patients"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActivePage("/admin/patients")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                Patients
              </Link>
              <Link
                href="/admin/consultations"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActivePage("/admin/consultations")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                Consultations
              </Link>
              <span className="text-sm text-gray-600">Admin: {admin.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
