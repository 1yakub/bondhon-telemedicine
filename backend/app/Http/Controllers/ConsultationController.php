<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreConsultationRequest;
use App\Http\Resources\ConsultationResource;
use App\Models\Consultation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

/**
 * Consultations for the signed in patient or doctor. Who may see or change one is
 * decided by ConsultationPolicy through the `can` middleware on the routes.
 */
class ConsultationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $consultations = Consultation::query()
            ->when($user->role === 'patient', fn ($q) => $q->where('patient_id', $user->id))
            ->when($user->role === 'doctor', fn ($q) => $q->where('doctor_id', $user->id))
            ->with(['doctor.doctor', 'patient', 'payment'])
            ->latest()
            ->get();

        return ConsultationResource::collection($consultations);
    }

    public function show(Consultation $consultation): ConsultationResource
    {
        return new ConsultationResource($consultation->load(['doctor.doctor', 'patient', 'payment']));
    }

    public function store(StoreConsultationRequest $request): JsonResponse
    {
        $doctor = User::query()->whereKey($request->integer('doctor_id'))->with('doctor')->firstOrFail();

        if (! $doctor->doctor?->is_online) {
            throw ValidationException::withMessages([
                'doctor_id' => 'This doctor is offline right now. Pick a doctor who is online.',
            ]);
        }

        $consultation = Consultation::create([
            'patient_id' => $request->user()->id,
            'doctor_id' => $doctor->id,
            'patient_symptoms' => $request->input('patient_symptoms'),
            'fee_amount' => $doctor->doctor->fee_per_consultation,
            'payment_status' => 'pending',
        ]);

        return (new ConsultationResource($consultation->load(['doctor.doctor'])))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Consultation $consultation): JsonResponse
    {
        $consultation->delete();

        return response()->json(['message' => 'Consultation cancelled.']);
    }
}
