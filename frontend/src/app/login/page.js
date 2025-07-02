"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PatientLogin() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const router = useRouter();

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStep("otp");
        // Show debug OTP in development
        if (data.debug_otp) {
          setDebugOtp(data.debug_otp);
        }
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for session cookies
          body: JSON.stringify({ phone, otp }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("OTP verification successful:", data);
        // Smart redirect logic based on profile completion
        if (data.needs_profile_completion) {
          // Add a longer delay to ensure session is properly saved
          console.log("Redirecting to profile completion in 1 second...");
          setTimeout(() => {
            router.push("/patient/complete-profile");
          }, 1000);
        } else {
          console.log("Redirecting to dashboard in 1 second...");
          setTimeout(() => {
            router.push("/patient/dashboard");
          }, 1000);
        }
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");

    // Limit to 11 digits for Bangladesh
    if (digits.length > 11) return phone;

    return digits;
  };

  const isValidPhone = (phoneNumber) => {
    // Bangladesh mobile number validation
    return /^01[3-9]\d{8}$/.test(phoneNumber);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-600">Bondhon</h1>
            <span className="text-sm text-gray-500 ml-2">বন্ধন</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === "phone"
              ? "Enter your phone number to get started"
              : "Enter the verification code sent to your phone"}
          </p>
        </div>

        {/* Phone Number Step */}
        {step === "phone" && (
          <form className="mt-8 space-y-6" onSubmit={sendOtp}>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Mobile Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 text-sm">+880</span>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="appearance-none relative block w-full pl-16 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) =>
                        setPhone(formatPhoneNumber(e.target.value))
                      }
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your 11-digit mobile number (e.g., 01712345678)
                  </p>
                  {!isValidPhone(phone) && phone.length > 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      Must start with 01 followed by 3,4,5,6,7,8, or 9 (e.g.,
                      013, 017, 019)
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isValidPhone(phone) || loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* OTP Verification Step */}
        {step === "otp" && (
          <form className="mt-8 space-y-6" onSubmit={verifyOtp}>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    We sent a verification code to
                  </p>
                  <p className="font-medium text-gray-900">+88{phone}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                      setError("");
                      setDebugOtp("");
                    }}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-500"
                  >
                    Change number
                  </button>
                </div>

                {debugOtp && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Development Mode:</strong> Your OTP is{" "}
                      <strong>{debugOtp}</strong>
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError("");
                    setDebugOtp("");
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-500 underline"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Are you a doctor?{" "}
            <Link
              href="/doctor/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
