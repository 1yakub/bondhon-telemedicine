"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDoctorModal, setShowCreateDoctorModal] = useState(false);
  const [createDoctorLoading, setCreateDoctorLoading] = useState(false);
  const [createDoctorError, setCreateDoctorError] = useState("");
  const [createDoctorData, setCreateDoctorData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    specialization: "",
    qualifications: "",
    experience_years: "",
    fee_per_consultation: "",
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, statusFilter]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/doctors`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
      } else {
        setError("Failed to fetch doctors");
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialization
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((doctor) => {
        if (statusFilter === "online") return doctor.is_online;
        if (statusFilter === "offline") return !doctor.is_online;
        return true;
      });
    }

    setFilteredDoctors(filtered);
  };

  const toggleDoctorStatus = async (doctorId, currentStatus) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/doctors/${doctorId}/toggle-status`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        // Refresh doctors data
        await fetchDoctors();
      } else {
        setError("Failed to update doctor status");
      }
    } catch (err) {
      console.error("Failed to toggle doctor status:", err);
      setError("Network error. Please try again.");
    }
  };

  const createDoctor = async () => {
    setCreateDoctorLoading(true);
    setCreateDoctorError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/doctors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(createDoctorData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowCreateDoctorModal(false);
        setCreateDoctorData({
          name: "",
          email: "",
          password: "",
          phone: "",
          gender: "",
          specialization: "",
          qualifications: "",
          experience_years: "",
          fee_per_consultation: "",
        });
        await fetchDoctors(); // Refresh the doctor list
      } else {
        setCreateDoctorError(data.message || "Failed to create doctor");
      }
    } catch (err) {
      console.error("Failed to create doctor:", err);
      setCreateDoctorError("Network error. Please try again.");
    } finally {
      setCreateDoctorLoading(false);
    }
  };

  const handleCreateDoctorInputChange = (e) => {
    const { name, value } = e.target;
    setCreateDoctorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateDoctorSubmit = (e) => {
    e.preventDefault();
    createDoctor();
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-slate">Loading doctors...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Doctor Management</h1>
        <p className="mt-2 text-lg text-slate">
          Create and manage doctor accounts on the platform
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-saffron-100 border border-danger rounded-control p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Filters and Create Button */}
      <div className="bg-white rounded-control mb-6">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink-2 mb-1">
                Search Doctors
              </label>
              <input
                type="text"
                placeholder="Search by name, email, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
              >
                <option value="all">All Doctors</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setShowCreateDoctorModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-control text-sm font-medium inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Doctor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden rounded-control">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Total Doctors
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {doctors.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-control">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg
                  className="h-6 w-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Online Doctors
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {doctors.filter((d) => d.is_online).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-control">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg
                  className="h-6 w-6 text-saffron-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Complete Profiles
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {
                      doctors.filter(
                        (d) => d.specialization && d.qualifications
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-control">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg
                  className="h-6 w-6 text-saffron-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Offline Doctors
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {doctors.filter((d) => !d.is_online).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-control overflow-hidden">
        <div className="px-6 py-4 border-b border-rule">
          <h3 className="text-lg leading-6 font-medium text-ink">
            Doctor List
          </h3>
          <p className="mt-1 text-sm text-slate">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </p>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 text-slate-2 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h3 className="text-lg font-medium text-ink mb-2">
              No doctors found
            </h3>
            <p className="text-slate">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-rule">
              <thead className="bg-mist">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-rule">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-mist">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-mist-2 flex items-center justify-center">
                            <span className="text-sm font-medium text-ink-2">
                              {doctor.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-ink">
                            Dr. {doctor.name}
                          </div>
                          <div className="text-sm text-slate">
                            {doctor.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {doctor.specialization || "Not specified"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {doctor.experience_years
                        ? `${doctor.experience_years} years`
                        : "Not specified"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      ৳{doctor.fee_per_consultation || "Not set"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doctor.is_online
                            ? "bg-teal-50 text-teal-700"
                            : "bg-mist text-ink"
                        }`}
                      >
                        {doctor.is_online ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/doctors/${doctor.id}`}
                          className="text-teal-600 hover:text-teal-700"
                        >
                          Manage
                        </Link>
                        <span className="text-slate-2">|</span>
                        <button
                          onClick={() =>
                            toggleDoctorStatus(doctor.id, doctor.is_online)
                          }
                          className="text-teal-600 hover:text-green-900"
                        >
                          {doctor.is_online ? "Set Offline" : "Set Online"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Doctor Modal */}
      {showCreateDoctorModal && (
        <div className="fixed inset-0 bg-slate bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lift rounded-control bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-ink">
                  Create New Doctor Account
                </h3>
                <button
                  onClick={() => setShowCreateDoctorModal(false)}
                  className="text-slate-2 hover:text-slate"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {createDoctorError && (
                <div className="mb-4 bg-saffron-100 border border-danger rounded-control p-3">
                  <p className="text-sm text-danger">{createDoctorError}</p>
                </div>
              )}

              <form onSubmit={handleCreateDoctorSubmit} className="space-y-4">
                {/* Required Fields */}
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={createDoctorData.name}
                    onChange={handleCreateDoctorInputChange}
                    required
                    className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={createDoctorData.email}
                    onChange={handleCreateDoctorInputChange}
                    required
                    className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                    placeholder="doctor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={createDoctorData.password}
                    onChange={handleCreateDoctorInputChange}
                    required
                    className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={createDoctorData.phone}
                      onChange={handleCreateDoctorInputChange}
                      className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={createDoctorData.gender}
                      onChange={handleCreateDoctorInputChange}
                      className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={createDoctorData.specialization}
                    onChange={handleCreateDoctorInputChange}
                    className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                    placeholder="e.g., Cardiology, Dermatology"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      value={createDoctorData.experience_years}
                      onChange={handleCreateDoctorInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1">
                      Consultation Fee (৳)
                    </label>
                    <input
                      type="number"
                      name="fee_per_consultation"
                      value={createDoctorData.fee_per_consultation}
                      onChange={handleCreateDoctorInputChange}
                      min="0"
                      step="50"
                      className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1">
                    Qualifications
                  </label>
                  <textarea
                    name="qualifications"
                    value={createDoctorData.qualifications}
                    onChange={handleCreateDoctorInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
                    placeholder="MBBS, MD, Specializations..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateDoctorModal(false)}
                    className="px-4 py-2 border border-rule rounded-control text-sm font-medium text-ink-2 hover:bg-mist"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createDoctorLoading}
                    className="px-4 py-2 bg-teal-600 border border-transparent rounded-control text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createDoctorLoading ? "Creating..." : "Create Doctor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
