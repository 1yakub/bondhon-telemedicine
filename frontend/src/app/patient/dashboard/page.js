"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchDoctors();
    fetchConsultations();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors`
      );
      if (response.ok) {
        const data = await response.json();
        // Show only online doctors on dashboard
        const onlineDoctors = data.doctors.filter((doc) => doc.is_online);
        setDoctors(onlineDoctors.slice(0, 3)); // Show top 3 online doctors
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
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
        const allConsultations = data.consultations || [];
        setConsultations(allConsultations);

        // Set recent consultations (last 3)
        setRecentConsultations(allConsultations.slice(0, 3));

        // Calculate and set dashboard stats
        const stats = calculateStats(allConsultations);
        setDashboardStats(stats);
      }
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
    }
  };

  const calculateStats = (consultations) => {
    if (!consultations || consultations.length === 0) {
      return {
        totalConsultations: 0,
        thisMonth: 0,
        totalSpent: 0,
        favoriteDoctor: "None",
        topSpecialization: "None",
      };
    }

    const totalConsultations = consultations.length;

    // This month consultations
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = consultations.filter((c) => {
      const consultationDate = new Date(c.created_at);
      return (
        consultationDate.getMonth() === currentMonth &&
        consultationDate.getFullYear() === currentYear
      );
    }).length;

    // Total spent (only paid consultations)
    const totalSpent = consultations
      .filter((c) => c.payment_status === "paid")
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

    // Most consulted doctor
    const doctorCounts = {};
    consultations.forEach((c) => {
      const doctorName = c.doctor?.name;
      if (doctorName) {
        doctorCounts[doctorName] = (doctorCounts[doctorName] || 0) + 1;
      }
    });
    const favoriteDoctor =
      Object.keys(doctorCounts).length > 0
        ? Object.keys(doctorCounts).reduce((a, b) =>
            doctorCounts[a] > doctorCounts[b] ? a : b
          )
        : "None";

    // Most consulted specialization
    const specializationCounts = {};
    consultations.forEach((c) => {
      const spec = c.doctor?.specialization;
      if (spec) {
        specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
      }
    });
    const topSpecialization =
      Object.keys(specializationCounts).length > 0
        ? `${Object.keys(specializationCounts).reduce((a, b) =>
            specializationCounts[a] > specializationCounts[b] ? a : b
          )} (${Object.values(specializationCounts).reduce((a, b) =>
            a > b ? a : b
          )})`
        : "None";

    return {
      totalConsultations,
      thisMonth,
      totalSpent,
      favoriteDoctor,
      topSpecialization,
    };
  };

  const handleConsultNow = (doctor) => {
    if (!user) {
      // Redirect to login if not authenticated (shouldn't happen in dashboard but just in case)
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return "✅";
      case "pending":
        return "⏳";
      case "failed":
        return "❌";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="py-6 px-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name || "Patient"}! 👋
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Your health is our priority. Book a consultation with our
                doctors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/doctors"
              className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
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
              </div>
              <span className="text-sm font-medium text-gray-900">
                Browse All Doctors
              </span>
            </Link>

            <Link
              href="/patient/consultations"
              className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
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
              <span className="text-sm font-medium text-gray-900">
                My Consultations
              </span>
            </Link>

            <Link
              href="/patient/profile"
              className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
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
              <span className="text-sm font-medium text-gray-900">
                Edit Profile
              </span>
            </Link>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Profile
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {user?.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-sm text-gray-500">+880{user?.phone}</p>
              </div>
            </div>

            {user?.gender && (
              <div className="text-sm text-gray-600">
                <strong>Gender:</strong>{" "}
                {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
              </div>
            )}

            {user?.date_of_birth && (
              <div className="text-sm text-gray-600">
                <strong>Age:</strong>{" "}
                {new Date().getFullYear() -
                  new Date(user.date_of_birth).getFullYear()}{" "}
                years
              </div>
            )}

            <Link
              href="/patient/profile"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
            >
              Edit Profile →
            </Link>
          </div>
        </div>

        {/* Health Stats Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Health Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Consultations</span>
              <span className="text-sm font-medium text-gray-900">
                {dashboardStats.totalConsultations}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-sm font-medium text-gray-900">
                {dashboardStats.thisMonth}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Spent</span>
              <span className="text-sm font-medium text-gray-900">
                ৳{dashboardStats.totalSpent}
              </span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">Favorite Doctor</p>
              <p className="text-sm font-medium text-gray-900">
                {dashboardStats.favoriteDoctor}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Online Doctors Section */}
      {doctors.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Online Doctors Available Now
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">
                      {getGenderIcon(doctor.gender)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {doctor.specialization}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Experience</span>
                    <span className="font-medium">
                      {doctor.experience_years} years
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Consultation Fee</span>
                    <span className="font-medium">
                      ৳{doctor.fee_per_consultation}
                    </span>
                  </div>
                </div>

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
            ))}
          </div>
        </div>
      )}

      {/* Recent Consultations Section */}
      {recentConsultations.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Consultations
            </h2>
            <Link
              href="/patient/consultations"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentConsultations.map((consultation) => (
                <div key={consultation.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">
                          {getGenderIcon(consultation.doctor?.gender)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Dr. {consultation.doctor?.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {consultation.doctor?.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            consultation.payment_status
                          )}`}
                        >
                          {getStatusIcon(consultation.payment_status)}{" "}
                          {consultation.payment_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(consultation.created_at)}
                      </p>
                    </div>
                  </div>

                  {consultation.patient_symptoms && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        <strong>Symptoms:</strong>{" "}
                        {consultation.patient_symptoms}
                      </p>
                    </div>
                  )}

                  {consultation.doctor_notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Doctor's Notes:</strong>{" "}
                        {consultation.doctor_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentConsultations.length === 0 && (
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-6xl mb-4">🩺</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No consultations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start your health journey by consulting with our experienced
              doctors.
            </p>
            <Link
              href="/doctors"
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-sm font-medium"
            >
              Find a Doctor
            </Link>
          </div>
        </div>
      )}

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
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white"
                placeholder="Briefly describe your health concerns..."
                style={{
                  minHeight: "80px",
                }}
              />
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
    </>
  );
}
