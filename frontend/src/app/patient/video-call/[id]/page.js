"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// The call component pulls in the Agora SDK, which needs a browser; never render it on the server.
const VideoCall = dynamic(() => import("../../../../components/video/VideoCall"), { ssr: false });

export default function PatientVideoCall() {
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

      const data = await response.json().catch(() => ({}));
      const consultationData = data.consultation || data.data;

      if (response.ok && consultationData) {

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
    // Redirect to consultations page after call ends
    router.push("/patient/consultations");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mist">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mist">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-saffron-100 border border-danger text-danger px-4 py-3 rounded-sm mb-4">
            <p className="font-bold">Unable to Join Video Call</p>
            <p>{error}</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={fetchConsultationDetails}
              className="bg-teal-600 text-white px-4 py-2 rounded-sm hover:bg-teal-700 mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/patient/consultations")}
              className="bg-slate text-white px-4 py-2 rounded-sm hover:bg-ink-2"
            >
              Back to Consultations
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
              Video Consultation with Dr. {consultation.doctor?.name}
            </h1>
            <p className="text-sm text-slate-2">
              {consultation.specialization} •{" "}
              {new Date((consultation.scheduled_at || consultation.created_at)).toLocaleDateString()} at{" "}
              {consultation.appointment_time}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-400">Paid Consultation</p>
            <p className="text-xs text-slate-2">ID: {consultationId}</p>
          </div>
        </div>
      </div>

      {/* Video Call Component */}
      <VideoCall
        consultationId={consultationId}
        userRole="patient"
        onCallEnd={handleCallEnd}
      />

      {/* Emergency Exit Button */}
      <button
        onClick={() => router.push("/patient/consultations")}
        className="absolute top-20 right-4 z-20 bg-danger hover:opacity-90 text-white px-3 py-1 rounded-sm text-sm"
      >
        Exit
      </button>
    </div>
  );
}
