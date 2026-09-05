"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, statusFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/patients`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients);
      } else {
        setError("Failed to fetch patients");
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone?.includes(searchTerm) ||
          patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((patient) => patient.status === statusFilter);
    }

    setFilteredPatients(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-teal-50 text-teal-700";
      case "inactive":
        return "bg-mist text-ink";
      default:
        return "bg-mist text-ink";
    }
  };

  const getGenderIcon = (gender) => {
    if (gender === "male") return "";
    if (gender === "female") return "";
    return "";
  };

  const openPatientModal = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-slate">Loading patients...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Patient Management</h1>
        <p className="mt-2 text-lg text-slate">
          View and manage platform patients
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-saffron-100 border border-danger rounded-control p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-control mb-6">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink-2 mb-1">
                Search Patients
              </label>
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
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
                <option value="all">All Patients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Total Patients
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {patients.length}
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
                    Active Patients
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {patients.filter((p) => p.is_active).length}
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
                    {patients.filter((p) => p.profile_complete).length}
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
                    New This Month
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {
                      patients.filter(
                        (p) =>
                          new Date(p.registration_date).getMonth() ===
                            new Date().getMonth() &&
                          new Date(p.registration_date).getFullYear() ===
                            new Date().getFullYear()
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-control overflow-hidden">
        <div className="px-6 py-4 border-b border-rule">
          <h3 className="text-lg leading-6 font-medium text-ink">
            Patient List
          </h3>
          <p className="mt-1 text-sm text-slate">
            Showing {filteredPatients.length} of {patients.length} patients
          </p>
        </div>

        {filteredPatients.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-ink mb-2">
              No patients found
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
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Consultations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Last Activity
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
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-mist">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-mist-2 flex items-center justify-center">
                            <span className="text-lg">
                              {getGenderIcon(patient.gender)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-ink">
                            {patient.name || "Unnamed Patient"}
                          </div>
                          <div className="text-sm text-slate">
                            {patient.age
                              ? `${patient.age} years old`
                              : "Age unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-ink">
                        +880{patient.phone}
                      </div>
                      <div className="text-sm text-slate">
                        {patient.email || "No email"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {patient.total_consultations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      ৳{patient.total_spent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {formatDate(patient.last_consultation_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          patient.status
                        )}`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openPatientModal(patient)}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lift rounded-control bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-ink">
                  Patient Details
                </h3>
                <button
                  onClick={() => setShowPatientModal(false)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-semibold text-ink mb-3">
                    Personal Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-ink-2">Name:</span>
                      <span className="ml-2 text-ink">
                        {selectedPatient.name || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">Phone:</span>
                      <span className="ml-2 text-ink">
                        +880{selectedPatient.phone}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">Email:</span>
                      <span className="ml-2 text-ink">
                        {selectedPatient.email || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">Gender:</span>
                      <span className="ml-2 text-ink">
                        {selectedPatient.gender || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">Age:</span>
                      <span className="ml-2 text-ink">
                        {selectedPatient.age
                          ? `${selectedPatient.age} years`
                          : "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Address:
                      </span>
                      <span className="ml-2 text-ink">
                        {selectedPatient.address || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div>
                  <h4 className="text-md font-semibold text-ink mb-3">
                    Activity Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-ink-2">
                        Registration:
                      </span>
                      <span className="ml-2 text-ink">
                        {formatDate(selectedPatient.registration_date)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Total Consultations:
                      </span>
                      <span className="ml-2 text-ink">
                        {selectedPatient.total_consultations}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Total Spent:
                      </span>
                      <span className="ml-2 text-ink">
                        ৳{selectedPatient.total_spent}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Last Consultation:
                      </span>
                      <span className="ml-2 text-ink">
                        {formatDate(selectedPatient.last_consultation_date)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Favorite Doctor:
                      </span>
                      <span className="ml-2 text-ink">
                        {selectedPatient.favorite_doctor || "None"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">Status:</span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          selectedPatient.status
                        )}`}
                      >
                        {selectedPatient.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 bg-slate hover:bg-ink-2 text-white rounded-control text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
