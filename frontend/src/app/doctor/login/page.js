"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DoctorLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/doctor/login`,
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
        console.log("Doctor login successful:", data);
        // Redirect to doctor dashboard
        router.push("/doctor/dashboard");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-teal-600">Bondhon</h1>
            <span className="text-sm text-slate ml-2">বন্ধন</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-ink">
            Doctor Portal
          </h2>
          <p className="mt-2 text-sm text-slate">
            Sign in to your doctor account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-control shadow-lift">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-rule placeholder:text-slate-2 text-ink rounded-control focus:outline-hidden focus:ring-green-500 focus:border-teal-100 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ink-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-rule placeholder:text-slate-2 text-ink rounded-control focus:outline-hidden focus:ring-green-500 focus:border-teal-100 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-saffron-100 border border-danger rounded-control p-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-control text-white bg-teal-600 hover:bg-teal-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <a
                  href="#"
                  className="text-sm text-teal-600 hover:text-teal-600"
                >
                  Forgot your password?
                </a>
              </div>
            </div>
          </div>
        </form>

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-slate">
            Are you a patient?{" "}
            <Link
              href="/login"
              className="font-medium text-teal-600 hover:text-teal-600"
            >
              Patient Login
            </Link>
          </p>
          <p className="text-sm text-slate">
            Need admin access?{" "}
            <Link
              href="/admin/login"
              className="font-medium text-saffron-600 hover:text-saffron-600"
            >
              Admin Login
            </Link>
          </p>
          <Link
            href="/"
            className="inline-block text-sm text-slate hover:text-ink-2"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-teal-50 border border-teal-100 rounded-control p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
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
              <h3 className="text-sm font-medium text-teal-700">
                Doctor Portal Access
              </h3>
              <div className="mt-2 text-sm text-teal-700">
                <p>
                  Use the email and password provided by your administrator to
                  access your doctor dashboard. If you don't have credentials,
                  please contact the admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
