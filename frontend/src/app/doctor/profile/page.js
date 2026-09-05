"use client";

import { useState, useEffect } from "react";

export default function DoctorProfile() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [formData, setFormData] = useState({
    // User fields
    name: "",
    profile_photo: "",
    gender: "",
    date_of_birth: "",
    // Doctor fields
    specialization: "",
    qualifications: "",
    experience_years: "",
    fee_per_consultation: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors/profile`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDoctor(data.user);

        // Pre-populate form with current data
        setFormData({
          name: data.user.name || "",
          profile_photo: data.user.profile_photo || "",
          gender: data.user.gender || "",
          date_of_birth: data.user.date_of_birth || "",
          specialization: data.user.doctor?.specialization || "",
          qualifications: data.user.doctor?.qualifications || "",
          experience_years: data.user.doctor?.experience_years || "",
          fee_per_consultation: data.user.doctor?.fee_per_consultation || "",
        });
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Network error. Please try again.");
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
        `${process.env.NEXT_PUBLIC_API_URL}/doctors/profile`,
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
        setDoctor(data.user);
        // Update form data with the latest information
        setFormData({
          name: data.user.name || "",
          profile_photo: data.user.profile_photo || "",
          gender: data.user.gender || "",
          date_of_birth: data.user.date_of_birth || "",
          specialization: data.user.doctor?.specialization || "",
          qualifications: data.user.doctor?.qualifications || "",
          experience_years: data.user.doctor?.experience_years || "",
          fee_per_consultation: data.user.doctor?.fee_per_consultation || "",
        });
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(passwordData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordData({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordSuccess("");
        }, 2000);
      } else {
        setPasswordError(data.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Password change error:", err);
      setPasswordError("Network error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-rule">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-ink">
                Profile Management
              </h1>
              <p className="mt-2 text-lg text-slate">
                Update your personal and professional information.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => setShowPasswordChange(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-control text-sm font-medium"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-saffron-100 border border-danger rounded-control p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-teal-50 border border-teal-100 rounded-control p-4">
            <p className="text-sm text-teal-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-control">
            <div className="px-6 py-4 border-b border-rule">
              <h3 className="text-lg font-medium text-ink">
                Personal Information
              </h3>
              <p className="mt-1 text-sm text-slate">
                Basic information about you.
              </p>
            </div>
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="date_of_birth"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    id="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile_photo"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Profile Photo URL
                  </label>
                  <input
                    type="url"
                    name="profile_photo"
                    id="profile_photo"
                    value={formData.profile_photo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-control">
            <div className="px-6 py-4 border-b border-rule">
              <h3 className="text-lg font-medium text-ink">
                Professional Information
              </h3>
              <p className="mt-1 text-sm text-slate">
                Your medical practice details and qualifications.
              </p>
            </div>
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="specialization"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Specialization *
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    id="specialization"
                    required
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Cardiology, Neurology, etc."
                  />
                </div>

                <div>
                  <label
                    htmlFor="experience_years"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    name="experience_years"
                    id="experience_years"
                    required
                    min="0"
                    max="50"
                    value={formData.experience_years}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fee_per_consultation"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Consultation Fee (৳) *
                  </label>
                  <input
                    type="number"
                    name="fee_per_consultation"
                    id="fee_per_consultation"
                    required
                    min="0"
                    value={formData.fee_per_consultation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="qualifications"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Qualifications
                  </label>
                  <textarea
                    name="qualifications"
                    id="qualifications"
                    rows={4}
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="MBBS, MD (Cardiology), Fellowship in Interventional Cardiology..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-2 text-white px-6 py-2 rounded-control text-sm font-medium"
            >
              {submitting ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-control max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">
              Change Password
            </h3>

            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="current_password"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    id="current_password"
                    required
                    value={passwordData.current_password}
                    onChange={handlePasswordInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new_password"
                    className="block text-sm font-medium text-ink-2"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    id="new_password"
                    required
                    minLength={8}
                    value={passwordData.new_password}
                    onChange={handlePasswordInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new_password_confirmation"
                    className="block text-sm font-medium text-ink-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="new_password_confirmation"
                    id="new_password_confirmation"
                    required
                    minLength={8}
                    value={passwordData.new_password_confirmation}
                    onChange={handlePasswordInputChange}
                    className="mt-1 block w-full border border-rule rounded-control px-3 py-2 text-ink bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="mt-4 bg-saffron-100 border border-danger rounded-control p-3">
                  <p className="text-sm text-danger">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="mt-4 bg-teal-50 border border-teal-100 rounded-control p-3">
                  <p className="text-sm text-teal-600">{passwordSuccess}</p>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="flex-1 py-2 px-4 border border-rule rounded-control text-sm font-medium text-ink-2 hover:bg-mist"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-control text-sm font-medium disabled:bg-slate-2"
                >
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
