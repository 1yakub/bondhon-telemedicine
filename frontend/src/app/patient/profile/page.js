"use client";

import { useState, useEffect } from "react";

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

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Pre-populate form with current data
        setFormData({
          name: data.user.name || "",
          date_of_birth: data.user.date_of_birth || "",
          gender: data.user.gender || "",
          address: data.user.address || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-control shadow-lift overflow-hidden">
        <div className="px-8 py-6 bg-teal-600">
          <h1 className="text-2xl font-bold text-white">Edit Your Profile</h1>
          <p className="text-blue-100 mt-2">
            Keep your information up to date for better healthcare service.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="bg-teal-50 border border-teal-100 text-teal-700 px-4 py-3 rounded-sm mb-4">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-saffron-100 border border-danger text-danger px-4 py-3 rounded-sm mb-4">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-ink-2"
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
              className="mt-1 block w-full px-3 py-2 border border-rule rounded-control text-ink bg-white focus:outline-hidden focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone (read-only) */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-ink-2"
            >
              Phone Number
            </label>
            <input
              type="text"
              id="phone"
              value={`+880${user?.phone || ""}`}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-rule rounded-control bg-mist text-slate cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-slate">
              Phone number cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="date_of_birth"
              className="block text-sm font-medium text-ink-2"
            >
              Date of Birth
            </label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-rule rounded-control text-ink bg-white focus:outline-hidden focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-ink-2"
            >
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-rule rounded-control text-ink bg-white focus:outline-hidden focus:ring-teal-500 focus:border-teal-500"
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
              className="block text-sm font-medium text-ink-2"
            >
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-rule rounded-control text-ink bg-white focus:outline-hidden focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter your full address"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-rule">
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-control text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
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

        {/* Profile Summary */}
        <div className="px-8 py-6 bg-mist border-t border-rule">
          <h3 className="text-lg font-medium text-ink mb-4">
            Profile Summary
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-ink-2">Name:</span>
              <p className="text-ink">{user?.name || "Not provided"}</p>
            </div>
            <div>
              <span className="font-medium text-ink-2">Phone:</span>
              <p className="text-ink">+880{user?.phone}</p>
            </div>
            <div>
              <span className="font-medium text-ink-2">Gender:</span>
              <p className="text-ink capitalize">
                {user?.gender || "Not provided"}
              </p>
            </div>
            <div>
              <span className="font-medium text-ink-2">Age:</span>
              <p className="text-ink">
                {user?.date_of_birth
                  ? `${
                      new Date().getFullYear() -
                      new Date(user.date_of_birth).getFullYear()
                    } years`
                  : "Not provided"}
              </p>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-ink-2">Address:</span>
              <p className="text-ink">{user?.address || "Not provided"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
