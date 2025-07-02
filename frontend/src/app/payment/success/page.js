"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [consultationData, setConsultationData] = useState(null);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get payment data from URL parameters
    const tranId = searchParams.get("tran_id");
    const amount = searchParams.get("amount");
    const status = searchParams.get("status");
    const consultationId = searchParams.get("consultation_id");

    if (tranId && status === "VALID") {
      setPaymentData({
        transactionId: tranId,
        amount: amount,
        status: status,
        consultationId: consultationId,
      });

      // Try to fetch consultation details using transaction ID
      if (tranId) {
        fetchConsultationDetails(tranId);
      }
    } else {
      setError("Invalid payment data received");
    }

    setLoading(false);

    // Check auth status (but don't redirect based on it)
    checkAuthStatus();

    // Check if session was restored
    const sessionRestored = searchParams.get("restored_session");

    // If session was restored, re-check auth status after a delay
    if (sessionRestored === "true") {
      setTimeout(() => {
        checkAuthStatus();
      }, 1000);
    }

    // Auto-redirect after 8 seconds to consultations page
    const timer = setTimeout(() => {
      if (isLoggedIn || sessionRestored === "true") {
        router.push("/patient/consultations");
      } else {
        router.push(
          "/login?message=Payment successful! Please log in to view your consultation."
        );
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [searchParams, router, isLoggedIn]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  const fetchConsultationDetails = async (transactionId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/consultations/public/${transactionId}`
      );

      if (response.ok) {
        const data = await response.json();
        setConsultationData(data.consultation);
      }
    } catch (error) {
      console.log("Could not fetch consultation details:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
          <Link
            href="/patient/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your consultation has been booked successfully.
        </p>

        {/* Consultation Details */}
        {consultationData && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              Your Consultation:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Doctor:</span>
                <span className="font-semibold text-blue-900">
                  Dr. {consultationData.doctor?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Specialization:</span>
                <span className="text-blue-900">
                  {consultationData.doctor?.specialization}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Date:</span>
                <span className="text-blue-900">
                  {new Date(
                    consultationData.consultation_date
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Time:</span>
                <span className="text-blue-900">
                  {consultationData.consultation_time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Status:</span>
                <span className="font-semibold text-green-600">
                  Confirmed & Paid
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">
              Payment Details:
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-gray-900 text-xs">
                  {paymentData.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">
                  ৳{paymentData.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600">
                  {paymentData.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">What's Next?</h3>
          <p className="text-green-700 text-sm">
            {consultationData
              ? `Dr. ${consultationData.doctor?.name} has been notified and will contact you soon for your consultation.`
              : "The doctor will be notified and will contact you soon for your consultation."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          {isLoggedIn || searchParams.get("restored_session") === "true" ? (
            <>
              <Link
                href="/patient/consultations"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200 block text-center"
              >
                View My Consultations
              </Link>
              <Link
                href="/patient/dashboard"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded transition duration-200 block text-center"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login?message=Payment successful! Please log in to view your consultation."
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200 block text-center"
              >
                Login to View Consultation
              </Link>
              <Link
                href="/doctors"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded transition duration-200 block text-center"
              >
                Book Another Consultation
              </Link>
            </>
          )}
        </div>

        {/* Auto-redirect Notice */}
        <p className="text-xs text-gray-500 mt-4">
          {isLoggedIn || searchParams.get("restored_session") === "true"
            ? `You will be automatically redirected to your consultations in 8 seconds.`
            : `You will be automatically redirected to login in 8 seconds to view your consultation.`}
        </p>
      </div>
    </div>
  );
}
