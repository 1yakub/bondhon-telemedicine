"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// The call component pulls in the Agora SDK, which needs a browser; never render it on the server.
const VideoCall = dynamic(() => import("../../../../components/video/VideoCall"), { ssr: false });

export default function DoctorVideoCall() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id;

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsultationDetails();
  }, [consultationId]);

  const fetchConsultationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/consultations/${consultationId}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        const consultationData = data.data;

        // Validate that consultation is paid and confirmed
        if (consultationData.payment_status !== "paid") {
          setError("This consultation has not been paid for yet.");
          return;
        }

        if (consultationData.status === "cancelled") {
          setError("This consultation has been cancelled.");
          return;
        }

        setConsultation(consultationData);
      } else {
        setError(data.message || "Failed to load consultation details");
      }
    } catch (err) {
      setError("Failed to connect to the server");
      console.error("Consultation fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallEnd = () => {
    // Redirect to doctor dashboard after call ends
    router.push("/doctor/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Unable to Join Video Call</p>
            <p>{error}</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={fetchConsultationDetails}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/doctor/dashboard")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with consultation info */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-75 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold">
              Video Consultation with {consultation.patient.name}
            </h1>
            <p className="text-sm text-gray-300">
              Age: {consultation.patient.age} • Phone:{" "}
              {consultation.patient.phone}
            </p>
            <p className="text-sm text-gray-300">
              {new Date(consultation.appointment_date).toLocaleDateString()} at{" "}
              {consultation.appointment_time}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-400">✅ Paid Consultation</p>
            <p className="text-xs text-gray-300">ID: {consultationId}</p>
            <p className="text-xs text-gray-300">
              Fee: ${consultation.consultation_fee}
            </p>
          </div>
        </div>
      </div>

      {/* Video Call Component */}
      <VideoCall
        consultationId={consultationId}
        userRole="doctor"
        onCallEnd={handleCallEnd}
      />

      {/* Patient Notes Section - Only visible to doctor */}
      <div className="absolute bottom-20 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg max-w-xs">
        <h3 className="text-sm font-semibold mb-2">Patient Information</h3>
        <div className="text-xs space-y-1">
          <p>
            <strong>Name:</strong> {consultation.patient.name}
          </p>
          <p>
            <strong>Age:</strong> {consultation.patient.age}
          </p>
          <p>
            <strong>Gender:</strong> {consultation.patient.gender}
          </p>
          <p>
            <strong>Phone:</strong> {consultation.patient.phone}
          </p>
          {consultation.symptoms && (
            <p>
              <strong>Symptoms:</strong> {consultation.symptoms}
            </p>
          )}
        </div>
      </div>

      {/* Emergency Exit Button */}
      <button
        onClick={() => router.push("/doctor/dashboard")}
        className="absolute top-20 right-4 z-20 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
      >
        Exit
      </button>
    </div>
  );
}
