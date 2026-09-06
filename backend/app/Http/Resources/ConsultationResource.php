<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Consultation */
class ConsultationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewerIsPatient = $request->user()?->role === 'patient';

        return [
            'id' => $this->id,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'amount' => (string) $this->fee_amount,
            'patient_symptoms' => $this->patient_symptoms,
            'doctor_notes' => $this->when(! $viewerIsPatient, $this->doctor_notes),
            'started_at' => $this->started_at,
            'ended_at' => $this->ended_at,
            'duration_minutes' => $this->duration_minutes,
            'created_at' => $this->created_at,
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $this->doctor->id,
                'name' => $this->doctor->name,
                'gender' => $this->doctor->gender,
                'profile_photo' => $this->doctor->profile_photo,
                'specialization' => $this->doctor->doctor?->specialization,
                'qualifications' => $this->doctor->doctor?->qualifications,
                'is_online' => (bool) $this->doctor->doctor?->is_online,
            ]),
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient->id,
                'name' => $this->patient->name,
                'gender' => $this->patient->gender,
                'age' => $this->patient->date_of_birth?->age,
                // the phone is for the treating doctor and the desk only
                'phone' => $this->when(! $viewerIsPatient, $this->patient->phone),
            ]),
            'payment' => $this->whenLoaded('payment', fn () => $this->payment ? [
                'status' => $this->payment->ssl_status,
                'transaction_id' => $this->payment->ssl_transaction_id,
                'paid_at' => $this->payment->paid_at,
            ] : null),
        ];
    }
}
