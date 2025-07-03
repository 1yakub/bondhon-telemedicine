"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DoctorLayout({ children }) {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Exclude login page from layout
  const isLoginPage = pathname === "/doctor/login";

  useEffect(() => {
    if (!isLoginPage) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [isLoginPage]);

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
        if (data.user.role === "doctor") {
          setDoctor(data.user);
        } else {
          router.push("/doctor/login");
        }
      } else {
        router.push("/doctor/login");
      }
    } catch (err) {
      router.push("/doctor/login");
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!doctor) return;

    setStatusUpdating(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctor/toggle-status`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDoctor({
          ...doctor,
          doctor: {
            ...doctor.doctor,
            is_online: data.is_online,
          },
        });
      } else {
        setError("Failed to update status");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/doctor/login");
    } catch (err) {
      router.push("/doctor/login");
    }
  };

  const isActivePage = (path) => {
    return pathname === path;
  };

  // Show loading for authentication check
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

  // Render login page without layout
  if (isLoginPage) {
    return children;
  }

  // Render protected pages with doctor layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/doctor/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">🩺 Bondhon</h1>
              <span className="ml-2 text-sm text-gray-500 hidden sm:inline">
                বন্ধন
              </span>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Online Status Toggle */}
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    doctor?.doctor?.is_online
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-1 ${
                      doctor?.doctor?.is_online ? "bg-green-400" : "bg-gray-400"
                    }`}
                  ></span>
                  {doctor?.doctor?.is_online ? "Online" : "Offline"}
                </span>
                <button
                  onClick={toggleOnlineStatus}
                  disabled={statusUpdating}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  title="Toggle Online Status"
                >
                  {statusUpdating ? "..." : "Toggle"}
                </button>
              </div>

              {/* Doctor Name */}
              <span className="text-sm text-gray-600 hidden sm:inline">
                Dr. {doctor?.name}
              </span>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <div className="flex justify-center">
              <div className="flex space-x-8">
                <Link
                  href="/doctor/dashboard"
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    isActivePage("/doctor/dashboard")
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg mb-1">🏠</span>
                    <span>Dashboard</span>
                  </div>
                </Link>

                <Link
                  href="/doctor/consultations"
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    isActivePage("/doctor/consultations")
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg mb-1">📋</span>
                    <span>Consultations</span>
                  </div>
                </Link>

                <Link
                  href="/doctor/profile"
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    isActivePage("/doctor/profile")
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg mb-1">👤</span>
                    <span>Profile</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
