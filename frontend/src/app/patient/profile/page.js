"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.user.role !== "patient") {
          router.push("/login");
          return;
        }
        setUser(data.user);

        // Pre-populate form with current data
        setFormData({
          name: data.user.name || "",
          date_of_birth: data.user.date_of_birth || "",
          gender: data.user.gender || "",
          address: data.user.address || "",
        });
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Auth check error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
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
    setSuccess("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setUser(data.user);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
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
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Bondhon</h1>
              <span className="ml-2 text-sm text-gray-500">বন্ধন</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/patient/dashboard"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/doctors"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Doctors
              </Link>
              <span className="text-sm text-gray-600">+880{user?.phone}</span>
              <button
                onClick={logout}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-8 py-6 bg-blue-600">
            <h1 className="text-2xl font-bold text-white">Edit Your Profile</h1>
            <p className="text-blue-100 mt-2">
              Keep your information up to date for better healthcare service.
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

            {/* Phone (read-only) */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                value={`+880${user?.phone}`}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Phone number cannot be changed. Contact support if needed.
              </p>
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

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/patient/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <button
                type="submit"
                disabled={!formData.name || submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  "Update Profile"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Information */}
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
                Account Information
              </h3>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Account Type:</strong> Patient
                </p>
                <p>
                  <strong>Joined:</strong>{" "}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Recently"}
                </p>
                <p>
                  <strong>Profile Status:</strong>{" "}
                  <span className="text-green-600 font-medium">Complete</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
