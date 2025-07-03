"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function PatientLayout({ children }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

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
        if (data.user.role === "patient") {
          setPatient(data.user);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/");
    } catch (err) {
      router.push("/");
    }
  };

  const isActivePage = (path) => {
    return pathname === path;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/patient/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">🩺 Bondhon</h1>
              <span className="ml-2 text-sm text-gray-500 hidden sm:inline">
                বন্ধন
              </span>
            </Link>

            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Primary CTA - Find Doctor */}
              <Link
                href="/doctors"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm font-medium inline-flex items-center"
              >
                <span className="hidden sm:inline">👨‍⚕️ Find</span>
                <span className="sm:hidden">👨‍⚕️</span>
                <span className="hidden sm:inline ml-1">Doctor</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 p-2"
                title="Logout"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Navigation - Mobile Optimized */}
          <div className="border-t border-gray-200">
            <div className="flex justify-center">
              <div className="flex space-x-8 sm:space-x-12">
                <Link
                  href="/doctors"
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    pathname === "/doctors"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg mb-1">👨‍⚕️</span>
                    <span className="hidden sm:inline">Find Doctor</span>
                    <span className="sm:hidden text-xs">Doctors</span>
                  </div>
                </Link>

                <Link
                  href="/patient/consultations"
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    isActivePage("/patient/consultations")
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg mb-1">📋</span>
                    <span className="hidden sm:inline">My Consultations</span>
                    <span className="sm:hidden text-xs">History</span>
                  </div>
                </Link>

                <Link
                  href="/patient/profile"
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    isActivePage("/patient/profile")
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg mb-1">👤</span>
                    <span className="hidden sm:inline">Profile</span>
                    <span className="sm:hidden text-xs">Profile</span>
                  </div>
                </Link>

                <Link
                  href="/patient/dashboard"
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    isActivePage("/patient/dashboard")
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg mb-1">🏠</span>
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden text-xs">Home</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
