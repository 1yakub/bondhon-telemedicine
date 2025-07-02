"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientConsultations() {
  const [user, setUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        fetchConsultations();
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Auth check error:", err);
      router.push("/login");
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
        setConsultations(data.consultations || []);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "confirmed":
        return "✅";
      case "completed":
        return "🏁";
      case "cancelled":
        return "❌";
      default:
        return "❓";
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Link
                href="/patient/profile"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">
                My Consultations
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Track your healthcare consultations and appointments.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                href="/doctors"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
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
                Book New Consultation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {consultations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No consultations yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't booked any consultations yet. Start by browsing our
              available doctors.
            </p>
            <Link
              href="/doctors"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium inline-flex items-center"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Browse Doctors
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {consultations.map((consultation) => {
              const { date, time } = formatDateTime(consultation.scheduled_at);
              return (
                <div
                  key={consultation.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            {consultation.doctor?.profile_photo ? (
                              <img
                                src={consultation.doctor.profile_photo}
                                alt={consultation.doctor.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-lg">👨‍⚕️</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Dr.{" "}
                              {consultation.doctor?.name || "Unknown Doctor"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {consultation.doctor?.specialization ||
                                "General Practice"}
                            </p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              Date:
                            </span>
                            <p className="text-gray-900">{date}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Time:
                            </span>
                            <p className="text-gray-900">{time}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Duration:
                            </span>
                            <p className="text-gray-900">
                              {consultation.duration || 30} minutes
                            </p>
                          </div>
                        </div>

                        {consultation.notes && (
                          <div className="mt-4">
                            <span className="font-medium text-gray-700">
                              Notes:
                            </span>
                            <p className="text-gray-900 mt-1">
                              {consultation.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex flex-col items-end">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            consultation.status
                          )}`}
                        >
                          {getStatusIcon(consultation.status)}{" "}
                          {consultation.status?.charAt(0).toUpperCase() +
                            consultation.status?.slice(1)}
                        </span>

                        {consultation.amount && (
                          <p className="mt-2 text-lg font-semibold text-gray-900">
                            ৳{consultation.amount}
                          </p>
                        )}

                        <div className="mt-4 space-y-2">
                          {consultation.status === "confirmed" && (
                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium w-full">
                              Join Video Call
                            </button>
                          )}
                          {consultation.status === "pending" && (
                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium w-full">
                              Cancel
                            </button>
                          )}
                          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium w-full">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
