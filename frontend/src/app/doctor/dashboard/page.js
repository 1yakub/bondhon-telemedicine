"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState({
    total_consultations: 0,
    total_earnings: 0,
    pending_consultations: 0,
    completed_consultations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get user info first
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
        {
          credentials: "include",
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setDoctor(userData.user);
      }

      // Fetch consultations and stats in parallel.
      await Promise.all([fetchConsultations(), fetchStats()]);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/consultations/mine`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations);
      }
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctor/stats`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const formatDate = (dateString) => {
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
        return "bg-teal-50 text-teal-700";
      case "completed":
        return "bg-mist text-ink";
      case "cancelled":
        return "bg-saffron-100 text-danger";
      default:
        return "bg-mist text-ink";
    }
  };

  const getStatusMessage = (status) => {
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

  const renderActionButton = (consultation) => {
    const { status, id } = consultation;

    switch (status) {
      case "pending":
        return (
          <span className="text-sm text-slate italic">
            Waiting for payment
          </span>
        );
      case "confirmed":
        return (
          <Link
            href={`/doctor/video-call/${id}`}
            target="_blank"
            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-sm text-sm font-medium"
          >
            Join Video Call
          </Link>
        );
      case "in_progress":
        return (
          <Link
            href={`/doctor/video-call/${id}`}
            target="_blank"
            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-sm text-sm font-medium"
          >
            Continue Call
          </Link>
        );
      case "completed":
        return (
          <Link
            href={`/doctor/consultations/${id}`}
            className="text-teal-600 hover:text-teal-700 text-sm"
          >
            View Details
          </Link>
        );
      case "cancelled":
        return <span className="text-sm text-slate">Cancelled</span>;
      default:
        return (
          <Link
            href={`/doctor/consultations/${id}`}
            className="text-teal-600 hover:text-teal-700 text-sm"
          >
            View
          </Link>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">
          Welcome, Dr. {doctor?.name}
        </h1>
        <p className="mt-2 text-lg text-slate">
          {doctor?.doctor?.specialization} • {doctor?.doctor?.experience_years}{" "}
          years experience
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-saffron-100 border border-danger rounded-control p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden rounded-control">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg
                  className="h-6 w-6 text-slate-2"
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
                    Total Consultations
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {stats.total_consultations}
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
                  className="h-6 w-6 text-slate-2"
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
                    Total Earnings
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    ৳{stats.total_earnings}
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
                  className="h-6 w-6 text-slate-2"
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
                    Pending Consultations
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {stats.pending_consultations}
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
                  className="h-6 w-6 text-slate-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate truncate">
                    Completed Consultations
                  </dt>
                  <dd className="text-lg font-medium text-ink">
                    {stats.completed_consultations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Consultations */}
      <div className="bg-white overflow-hidden sm:rounded-control">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-ink">
            Recent Consultations
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate">
            Your latest consultation appointments
          </p>
        </div>
        <ul className="divide-y divide-rule">
          {consultations.length === 0 ? (
            <li className="px-4 py-4 text-center text-slate">
              No consultations found
            </li>
          ) : (
            consultations.slice(0, 10).map((consultation) => (
              <li key={consultation.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-mist-2 flex items-center justify-center">
                        <span className="text-sm font-medium text-ink-2">
                          {consultation.patient_name?.charAt(0).toUpperCase() ||
                            "P"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-ink">
                          {consultation.patient_name || "Unknown Patient"}
                        </p>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            consultation.status
                          )}`}
                        >
                          {getStatusMessage(consultation.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate">
                        {formatDate((consultation.scheduled_at || consultation.created_at))}
                      </p>
                      {consultation.patient_symptoms && (
                        <p className="text-sm text-slate mt-1">
                          Symptoms: {consultation.patient_symptoms}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-ink">
                      ৳{consultation.fee}
                    </span>
                    {renderActionButton(consultation)}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
        {consultations.length > 10 && (
          <div className="bg-mist px-4 py-3 text-center">
            <Link
              href="/doctor/consultations"
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              View all consultations
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
