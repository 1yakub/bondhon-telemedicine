"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
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
        `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login`,
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
        console.log("Admin login successful:", data);
        router.push("/admin/dashboard");
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
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-saffron-600">Bondhon</h1>
            <span className="text-sm text-slate ml-2">বন্ধন</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-ink">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-slate">
            Administrative access to the platform
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-8 rounded-control shadow-lift">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink-2"
                >
                  Administrator Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-rule placeholder:text-slate-2 text-ink rounded-control focus:outline-hidden focus:ring-purple-500 focus:border-saffron-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your administrator email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

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
                  className="appearance-none relative block w-full px-3 py-3 border border-rule placeholder:text-slate-2 text-ink rounded-control focus:outline-hidden focus:ring-purple-500 focus:border-saffron-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              {error && (
                <div className="bg-saffron-100 border border-danger rounded-control p-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-control text-white bg-saffron-500 hover:bg-saffron-600 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-slate-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Admin Sign In"
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-slate">
            <Link
              href="/login"
              className="font-medium text-teal-600 hover:text-teal-600"
            >
              Patient Login
            </Link>{" "}
            |{" "}
            <Link
              href="/doctor/login"
              className="font-medium text-teal-600 hover:text-teal-600"
            >
              Doctor Login
            </Link>
          </p>
          <Link
            href="/"
            className="inline-block text-sm text-slate hover:text-ink-2"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
