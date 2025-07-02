"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchDoctors();
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
        if (data.user.role === "patient") {
          setUser(data.user);
        }
      }
    } catch (err) {
      // User not authenticated, that's fine for public browsing
      console.log("User not authenticated");
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors`
      );
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
      } else {
        setError("Failed to load doctors");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConsultNow = (doctor) => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    if (!doctor.is_online) {
      alert("This doctor is currently offline. Please try again later.");
      return;
    }

    // Open booking modal for authenticated users
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    setBookingError("");
    setSymptoms("");
  };

  const handleBookConsultation = async () => {
    if (!selectedDoctor || !user) return;

    console.log("Starting booking process...");
    console.log("Selected Doctor:", selectedDoctor);
    console.log("Symptoms:", symptoms);
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

    setBookingLoading(true);
    setBookingError("");

    try {
      // Step 1: Get CSRF token first
      console.log("Getting CSRF token...");
      const csrfResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL.replace(
          "/api",
          ""
        )}/sanctum/csrf-cookie`,
        {
          credentials: "include",
        }
      );
      console.log("CSRF response status:", csrfResponse.status);

      // Get CSRF token from cookie
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];
      console.log("CSRF token found:", token ? "Yes" : "No");

      // Step 2: Create consultation
      const consultationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/consultations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(token && { "X-XSRF-TOKEN": decodeURIComponent(token) }),
          },
          credentials: "include",
          body: JSON.stringify({
            doctor_id: selectedDoctor.id,
            patient_symptoms: symptoms,
            scheduled_time: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          }),
        }
      );

      console.log("Consultation response status:", consultationResponse.status);
      console.log(
        "Consultation response headers:",
        Object.fromEntries(consultationResponse.headers.entries())
      );

      if (!consultationResponse.ok) {
        const errorText = await consultationResponse.text();
        console.log("Consultation error response:", errorText);
        setBookingError(
          `Failed to book consultation: ${consultationResponse.status}`
        );
        return;
      }

      const consultationData = await consultationResponse.json();
      console.log("Consultation response data:", consultationData);

      if (consultationResponse.ok) {
        // Step 3: Initiate payment
        const paymentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payments/initiate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              ...(token && { "X-XSRF-TOKEN": decodeURIComponent(token) }),
            },
            credentials: "include",
            body: JSON.stringify({
              consultation_id: consultationData.consultation.id,
            }),
          }
        );

        const paymentData = await paymentResponse.json();

        if (paymentResponse.ok && paymentData.status === "success") {
          // Redirect to SSLCOMMERZ payment gateway
          window.location.href = paymentData.payment_url;
        } else {
          setBookingError(paymentData.message || "Failed to initiate payment");
        }
      } else {
        setBookingError(
          consultationData.message || "Failed to book consultation"
        );
      }
    } catch (err) {
      setBookingError("Network error. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const getGenderIcon = (gender) => {
    if (gender === "male") return "👨‍⚕️";
    if (gender === "female") return "👩‍⚕️";
    return "🩺";
  };

  // Filter doctors based on search and specialization
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization =
      !filterSpecialization || doctor.specialization === filterSpecialization;
    return matchesSearch && matchesSpecialization;
  });

  const specializations = [
    ...new Set(doctors.map((doctor) => doctor.specialization)),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDoctors}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
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
                href="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              {user ? (
                <>
                  <Link
                    href="/patient/dashboard"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <span className="text-sm text-gray-600">
                    +880{user.phone}
                  </span>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/doctor/login"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Doctor Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Our Doctors</h1>
            <p className="mt-2 text-lg text-gray-600">
              Choose from our qualified medical professionals
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search doctors by name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Specialization Filter */}
              <div>
                <select
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm || filterSpecialization
                ? "No doctors found matching your criteria."
                : "No doctors available at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Doctor Avatar */}
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                      {doctor.profile_photo ? (
                        <img
                          src={doctor.profile_photo}
                          alt={doctor.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        getGenderIcon(doctor.gender)
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {doctor.name}
                      </h3>
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doctor.is_online
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mr-1 ${
                              doctor.is_online ? "bg-green-400" : "bg-gray-400"
                            }`}
                          ></span>
                          {doctor.is_online ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 008 10.172V5L8 4z"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {doctor.specialization}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
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
                      <span className="text-sm text-gray-600">
                        ৳{doctor.fee_per_consultation}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-2"
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
                      <span className="text-sm text-gray-600">
                        {doctor.experience_years} years experience
                      </span>
                    </div>
                  </div>

                  {/* Qualifications */}
                  {doctor.qualifications && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {doctor.qualifications}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleConsultNow(doctor)}
                    disabled={!doctor.is_online}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      doctor.is_online
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {doctor.is_online ? "Consult Now" : "Currently Offline"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Book Consultation with Dr. {selectedDoctor.name}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Specialization:</strong> {selectedDoctor.specialization}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Fee:</strong> ৳{selectedDoctor.fee_per_consultation}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Experience:</strong> {selectedDoctor.experience_years}{" "}
                years
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="symptoms"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Describe your symptoms (optional)
              </label>
              <textarea
                id="symptoms"
                name="symptoms"
                rows={3}
                value={symptoms}
                onChange={(e) => {
                  console.log("Textarea value:", e.target.value);
                  setSymptoms(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Briefly describe your health concerns..."
                style={{
                  minHeight: "80px",
                  color: "#374151",
                  backgroundColor: "#ffffff",
                }}
              />
              {/* Debug info */}
              <p className="text-xs text-gray-400 mt-1">
                Current value: "{symptoms}" (length: {symptoms?.length || 0})
              </p>
            </div>

            {bookingError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{bookingError}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBookConsultation}
                disabled={bookingLoading}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:bg-gray-400"
              >
                {bookingLoading ? "Booking..." : "Book Consultation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
