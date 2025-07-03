"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function PatientConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchConsultations();
  }, []);

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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={fetchConsultations}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="py-6 px-6">
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
      {consultations.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No consultations yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't booked any consultations yet. Start your health
              journey by consulting with our experienced doctors.
            </p>
            <Link
              href="/doctors"
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-sm font-medium"
            >
              Browse Doctors
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {consultations.map((consultation) => {
            const { date, time } = formatDateTime(consultation.created_at);
            return (
              <div
                key={consultation.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-600"
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
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {consultation.doctor?.name || "Unknown Doctor"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {consultation.doctor?.specialization ||
                            "General Practice"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          consultation.status
                        )}`}
                      >
                        {getStatusIcon(consultation.status)}{" "}
                        {consultation.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Consultation Details
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Date:</span> {date}
                        </p>
                        <p>
                          <span className="font-medium">Time:</span> {time}
                        </p>
                        <p>
                          <span className="font-medium">Consultation Fee:</span>{" "}
                          ৳{consultation.amount || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Payment Status:</span>{" "}
                          <span
                            className={
                              consultation.payment_status === "paid"
                                ? "text-green-600"
                                : consultation.payment_status === "pending"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }
                          >
                            {consultation.payment_status || "unknown"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Doctor Information
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Experience:</span>{" "}
                          {consultation.doctor?.experience_years || "N/A"} years
                        </p>
                        <p>
                          <span className="font-medium">Qualification:</span>{" "}
                          {consultation.doctor?.qualifications || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Contact:</span>{" "}
                          {consultation.doctor?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {consultation.patient_symptoms && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Symptoms Described
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {consultation.patient_symptoms}
                      </p>
                    </div>
                  )}

                  {consultation.doctor_notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Doctor's Notes
                      </h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                        {consultation.doctor_notes}
                      </p>
                    </div>
                  )}

                  {consultation.doctor_prescription && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Prescription
                      </h4>
                      <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-md">
                        {consultation.doctor_prescription}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Consultation ID: #{consultation.id}
                    </div>
                    <div className="flex space-x-3">
                      {consultation.status === "confirmed" && (
                        <Link
                          href={`/patient/video-call/${consultation.id}`}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Join Video Call
                        </Link>
                      )}
                      {consultation.payment_status === "pending" && (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                          Complete Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
