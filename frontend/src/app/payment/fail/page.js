"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentFailed() {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializePage = async () => {
      // Get payment data from URL parameters
      const tranId = searchParams.get("tran_id");
      const amount = searchParams.get("amount");
      const status = searchParams.get("status");
      const failedReason = searchParams.get("failedreason");

      setPaymentData({
        transactionId: tranId,
        amount: amount,
        status: status,
        failedReason: failedReason || "Payment was declined",
      });

      // Check auth status first
      await checkAuthStatus();

      // Check if session was restored
      const sessionRestored = searchParams.get("restored_session");

      // If session was restored, re-check auth status after a delay
      if (sessionRestored === "true") {
        setTimeout(async () => {
          await checkAuthStatus();
        }, 1000);
      }

      setLoading(false);
    };

    initializePage();
  }, [searchParams]);

  // Separate useEffect for auto-redirect to avoid dependency issues
  useEffect(() => {
    if (!authChecked) return; // Wait for auth check to complete

    const sessionRestored = searchParams.get("restored_session");

    const timer = setTimeout(() => {
      if (isLoggedIn || sessionRestored === "true") {
        router.push("/doctors?message=Please try booking again");
      } else {
        router.push(
          "/doctors?message=Payment failed. Please browse doctors and try again."
        );
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [authChecked, isLoggedIn, router, searchParams]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const userData = await response.json();
        console.log("Auth check successful:", userData); // Debug log
        setIsLoggedIn(true);
      } else {
        console.log("Auth check failed:", response.status); // Debug log
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.log("Auth check error:", error); // Debug log
      setIsLoggedIn(false);
    } finally {
      setAuthChecked(true); // Mark auth check as completed
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading
              ? "Processing payment result..."
              : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          Unfortunately, your payment could not be processed.
        </p>

        {/* Payment Details */}
        {paymentData && (
          <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-900 mb-2">
              Payment Details:
            </h3>
            <div className="space-y-1 text-sm">
              {paymentData.transactionId && (
                <div className="flex justify-between">
                  <span className="text-red-700">Transaction ID:</span>
                  <span className="font-mono text-red-900 text-xs">
                    {paymentData.transactionId}
                  </span>
                </div>
              )}
              {paymentData.amount && (
                <div className="flex justify-between">
                  <span className="text-red-700">Amount:</span>
                  <span className="font-semibold text-red-900">
                    ৳{paymentData.amount}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-red-700">Status:</span>
                <span className="font-semibold text-red-600">Failed</span>
              </div>
              {paymentData.failedReason && (
                <div className="mt-2">
                  <span className="text-red-700">Reason:</span>
                  <p className="text-red-900 text-xs mt-1">
                    {paymentData.failedReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2">
            What can you do?
          </h3>
          <ul className="text-yellow-700 text-sm text-left space-y-1">
            <li>• Try booking the consultation again</li>
            <li>• Check your card details and try again</li>
            <li>• Try a different payment method</li>
            <li>• Contact your bank if the issue persists</li>
          </ul>
        </div>

        {/* Action Buttons - Session Aware */}
        <div className="flex flex-col gap-3 w-full">
          {/* Debug info in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
              Debug: isLoggedIn={isLoggedIn.toString()}, authChecked=
              {authChecked.toString()}, restored_session=
              {searchParams.get("restored_session") || "null"}
            </div>
          )}
          {isLoggedIn || searchParams.get("restored_session") === "true" ? (
            <>
              <Link
                href="/doctors"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200 block text-center"
              >
                Try Again - Book Consultation
              </Link>
              <Link
                href="/patient/dashboard"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded transition duration-200 block text-center"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/patient/consultations"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded transition duration-200 block text-center"
              >
                View My Consultations
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login?redirect=/doctors&message=Login to try booking again"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200 block text-center"
              >
                Login & Try Again
              </Link>
              <Link
                href="/doctors"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded transition duration-200 block text-center"
              >
                Browse Doctors
              </Link>
            </>
          )}
        </div>

        {/* Auto-redirect Notice */}
        <p className="text-xs text-gray-500 mt-4">
          {isLoggedIn || searchParams.get("restored_session") === "true"
            ? `You will be automatically redirected to browse doctors in 8 seconds.`
            : `You will be automatically redirected to browse doctors in 8 seconds.`}
        </p>

        {/* Support Notice */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team for assistance with your
            payment.
          </p>
        </div>
      </div>
    </div>
  );
}
