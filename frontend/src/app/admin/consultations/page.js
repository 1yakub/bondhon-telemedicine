"use client";

import { useState, useEffect } from "react";

export default function AdminConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchConsultations();
  }, []);

  useEffect(() => {
    filterConsultations();
  }, [consultations, searchTerm, statusFilter, dateFilter]);

  const fetchConsultations = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/consultations`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations);
      } else {
        setError("Failed to fetch consultations");
      }
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterConsultations = () => {
    let filtered = consultations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (consultation) =>
          consultation.patient_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          consultation.doctor_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          consultation.id?.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (consultation) => consultation.status === statusFilter
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (consultation) => new Date(consultation.created_at) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(
            (consultation) => new Date(consultation.created_at) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(
            (consultation) => new Date(consultation.created_at) >= filterDate
          );
          break;
      }
    }

    setFilteredConsultations(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-saffron-100 text-ink";
      case "confirmed":
        return "bg-teal-50 text-teal-700";
      case "in_progress":
        return "bg-saffron-100 text-saffron-600";
      case "completed":
        return "bg-teal-50 text-teal-700";
      case "cancelled":
        return "bg-saffron-100 text-danger";
      default:
        return "bg-mist text-ink";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Awaiting Payment";
      case "confirmed":
        return "Ready for Call";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const openDetailsModal = (consultation) => {
    setSelectedConsultation(consultation);
    setShowDetailsModal(true);
  };

  const calculateStats = () => {
    const totalRevenue = filteredConsultations.reduce((sum, consultation) => {
      if (
        consultation.payment_amount &&
        consultation.ssl_payment_status === "VALID"
      ) {
        return sum + parseFloat(consultation.payment_amount);
      }
      return sum;
    }, 0);

    const statusCounts = filteredConsultations.reduce(
      (counts, consultation) => {
        counts[consultation.status] = (counts[consultation.status] || 0) + 1;
        return counts;
      },
      {}
    );

    return {
      total: filteredConsultations.length,
      revenue: totalRevenue,
      pending: statusCounts.pending || 0,
      completed: statusCounts.completed || 0,
      cancelled: statusCounts.cancelled || 0,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate">Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">
          Consultation Management
        </h1>
        <p className="mt-2 text-lg text-slate">
          Monitor and manage all platform consultations
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">
                Search Consultations
              </label>
              <input
                type="text"
                placeholder="Search by patient, doctor, or ID..."
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
                className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Awaiting Payment</option>
                <option value="confirmed">Ready for Call</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">
                Date Filter
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-rule rounded-control focus:outline-hidden focus:ring-teal-500 focus:border-teal-500 text-ink bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
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
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Total
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {stats.total}
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Revenue
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    ৳{stats.revenue}
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
                  className="h-6 w-6 text-yellow-400"
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
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {stats.pending}
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
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {stats.completed}
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
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Cancelled
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {stats.cancelled}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white rounded-control">
        <div className="px-6 py-4 border-b border-rule">
          <h3 className="text-lg font-medium text-ink">
            Consultations ({filteredConsultations.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-slate-2"
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
              <h3 className="mt-2 text-sm font-medium text-ink">
                No consultations found
              </h3>
              <p className="mt-1 text-sm text-slate">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your search filters."
                  : "Consultations will appear here once they are created."}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-rule">
              <thead className="bg-mist">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-rule">
                {filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-mist">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink">
                      #{consultation.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink">
                        {consultation.patient_name || "Anonymous"}
                      </div>
                      <div className="text-sm text-slate">
                        +880{consultation.patient_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink">
                        {consultation.doctor_name}
                      </div>
                      <div className="text-sm text-slate">
                        {consultation.doctor_specialization || "General"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {formatDate(consultation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          consultation.status
                        )}`}
                      >
                        {getStatusText(consultation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {consultation.payment_amount ? (
                        <span
                          className={`${
                            consultation.ssl_payment_status === "VALID"
                              ? "text-teal-600 font-medium"
                              : "text-slate"
                          }`}
                        >
                          ৳{consultation.payment_amount}
                          {consultation.ssl_payment_status === "VALID" && (
                            <span className="ml-1 text-xs text-teal-600">
                                                          </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-2">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openDetailsModal(consultation)}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Consultation Details Modal */}
      {showDetailsModal && selectedConsultation && (
        <div className="fixed inset-0 bg-slate bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lift rounded-control bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-ink">
                  Consultation Details - #{selectedConsultation.id}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
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
                {/* Patient Information */}
                <div>
                  <h4 className="text-md font-semibold text-ink mb-3">
                    Patient Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-ink-2">Name:</span>
                      <span className="ml-2 text-ink">
                        {selectedConsultation.patient_name || "Anonymous"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">Phone:</span>
                      <span className="ml-2 text-ink">
                        +880{selectedConsultation.patient_phone}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">Gender:</span>
                      <span className="ml-2 text-ink">
                        {selectedConsultation.patient_gender || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Doctor Information */}
                <div>
                  <h4 className="text-md font-semibold text-ink mb-3">
                    Doctor Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-ink-2">Name:</span>
                      <span className="ml-2 text-ink">
                        {selectedConsultation.doctor_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Specialization:
                      </span>
                      <span className="ml-2 text-ink">
                        {selectedConsultation.doctor_specialization ||
                          "General"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Consultation Fee:
                      </span>
                      <span className="ml-2 text-ink">
                        ৳{selectedConsultation.fee_per_consultation || "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consultation Details */}
                <div>
                  <h4 className="text-md font-semibold text-ink mb-3">
                    Consultation Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-ink-2">Status:</span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          selectedConsultation.status
                        )}`}
                      >
                        {getStatusText(selectedConsultation.status)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Created:
                      </span>
                      <span className="ml-2 text-ink">
                        {formatDate(selectedConsultation.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Last Updated:
                      </span>
                      <span className="ml-2 text-ink">
                        {formatDate(selectedConsultation.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="text-md font-semibold text-ink mb-3">
                    Payment Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-ink-2">Amount:</span>
                      <span className="ml-2 text-ink">
                        {selectedConsultation.payment_amount
                          ? `৳${selectedConsultation.payment_amount}`
                          : "Not paid"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-ink-2">
                        Payment Status:
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedConsultation.ssl_payment_status === "VALID"
                            ? "bg-teal-50 text-teal-700"
                            : "bg-saffron-100 text-danger"
                        }`}
                      >
                        {selectedConsultation.ssl_payment_status || "Pending"}
                      </span>
                    </div>
                    {selectedConsultation.transaction_id && (
                      <div>
                        <span className="font-medium text-ink-2">
                          Transaction ID:
                        </span>
                        <span className="ml-2 text-ink font-mono text-xs">
                          {selectedConsultation.transaction_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
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
