"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CompleteProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    gender: "",
    address: "",
  });

  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("Checking authentication...");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log("Auth response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Auth check successful:", data);

        if (data.user.role !== "patient") {
          console.error("User is not a patient:", data.user);
          router.push("/login");
          return;
        }
        setUser(data.user);

        // If profile is already complete, redirect to dashboard
        if (data.user.name) {
          console.log("Profile already complete, redirecting to dashboard");
          router.push("/patient/dashboard");
          return;
        }

        console.log("Profile needs completion, staying on this page");
      } else {
        const errorData = await response.json().catch(() => null);
        console.error("Auth check failed, status:", response.status, errorData);

        // Be more forgiving - wait longer and try again once before redirecting
        setTimeout(async () => {
          console.log("Retrying auth check...");
          try {
            const retryResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
              {
                credentials: "include",
                headers: {
                  Accept: "application/json",
                },
              }
            );

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log("Retry auth check successful:", retryData);
              setUser(retryData.user);
              setLoading(false);
              return;
            }
          } catch (retryErr) {
            console.error("Retry auth check also failed:", retryErr);
          }

          console.log("Both auth checks failed, redirecting to login");
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      setError("Failed to check authentication");
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      // Only set loading to false if we successfully got user data
      if (!user) {
        setTimeout(() => setLoading(false), 2000);
      } else {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        router.push("/patient/dashboard");
      } else {
        setError(data.message || "Failed to complete profile");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-blue-600">Bondhon</h1>
                <span className="ml-2 text-sm text-gray-500">বন্ধন</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">+880{user?.phone}</span>
              <button
                onClick={() => {
                  fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                    method: "POST",
                    credentials: "include",
                  }).then(() => router.push("/"));
                }}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-8 py-6 bg-blue-600">
            <h1 className="text-2xl font-bold text-white">
              Complete Your Profile
            </h1>
            <p className="text-blue-100 mt-2">
              We need some basic information to personalize your healthcare
              experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="date_of_birth"
                className="block text-sm font-medium text-gray-700"
              >
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full address"
              />
              <p className="mt-1 text-xs text-gray-500">
                This helps doctors understand your location for better care
                recommendations.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/login"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to login
              </Link>
              <button
                type="submit"
                disabled={!formData.name || submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  "Complete Profile"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Why do we need this information?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your profile information helps our doctors provide better care
                  by understanding your background and medical context. All
                  information is kept confidential and secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
