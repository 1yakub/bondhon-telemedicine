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
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchDoctors();
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

        // If profile is not complete, redirect to complete profile
        if (!data.user.name) {
          router.push("/patient/complete-profile");
          return;
        }

        // Fetch consultations for authenticated user
        fetchConsultations();
      } else {
        router.push("/login");
      }
    } catch (err) {
      setError("Failed to check authentication");
      router.push("/login");
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
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "confirmed":
        return "✅";
      case "in_progress":
        return "🔄";
      case "completed":
        return "🏁";
      case "cancelled":
        return "❌";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Home
          </Link>
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
                href="/doctors"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                All Doctors
              </Link>
              <Link
                href="/patient/profile"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                  <strong>Date of Birth:</strong>{" "}
                  {new Date(user.date_of_birth).toLocaleDateString()}
                </div>
              )}

              {user?.address && (
                <div className="text-sm text-gray-600">
                  <strong>Address:</strong> {user.address}
                </div>
              )}
            </div>
          </div>

          {/* Online Doctors */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Online Doctors
              </h3>
              <Link
                href="/doctors"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View All
              </Link>
            </div>

            {doctors.length === 0 ? (
              <p className="text-sm text-gray-500">
                No doctors online right now.
              </p>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        {doctor.profile_photo ? (
                          <img
                            src={doctor.profile_photo}
                            alt={doctor.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">
                            {getGenderIcon(doctor.gender)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doctor.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/doctors"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Consult
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Consultations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Recent Consultations
              </h3>
              <Link
                href="/patient/consultations"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View All
              </Link>
            </div>

            {recentConsultations.length === 0 ? (
              <p className="text-sm text-gray-500">
                No consultations yet. Book your first consultation!
              </p>
            ) : (
              <div className="space-y-3">
                {recentConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm mr-2">
                          {getStatusIcon(consultation.status)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {consultation.doctor?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {consultation.doctor?.specialization ||
                              "General Practice"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(consultation.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          consultation.status
                        )}`}
                      >
                        {consultation.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        ৳{consultation.amount || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dashboard Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Your Health Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardStats.totalConsultations || 0}
                </p>
                <p className="text-sm text-gray-500">Total Consultations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {dashboardStats.thisMonth || 0}
                </p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  ৳{dashboardStats.totalSpent || 0}
                </p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {dashboardStats.favoriteDoctor || "None"}
                </p>
                <p className="text-sm text-gray-500">Favorite Doctor</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>Most Consulted:</strong>{" "}
                {dashboardStats.topSpecialization || "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Health Tips Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Health Tips for Today
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                💧 Stay Hydrated
              </h4>
              <p className="text-sm text-blue-700">
                Drink at least 8 glasses of water daily for optimal health.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                🚶‍♂️ Daily Exercise
              </h4>
              <p className="text-sm text-green-700">
                30 minutes of physical activity can boost your immune system.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">
                😴 Quality Sleep
              </h4>
              <p className="text-sm text-purple-700">
                7-9 hours of sleep helps your body recover and heal.
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">
                🥗 Balanced Diet
              </h4>
              <p className="text-sm text-yellow-700">
                Include fruits, vegetables, and proteins in every meal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
