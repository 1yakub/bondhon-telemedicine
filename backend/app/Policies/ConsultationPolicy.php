<?php

namespace App\Policies;

use App\Models\Consultation;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * One place for who may do what with a consultation. Auto discovered by name.
 */
class ConsultationPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->role === 'admin' ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['patient', 'doctor'], true);
    }

    public function view(User $user, Consultation $consultation): bool
    {
        return $this->isParty($user, $consultation);
    }

    public function create(User $user): bool
    {
        return $user->role === 'patient';
    }

    public function delete(User $user, Consultation $consultation): Response
    {
        if ($user->role !== 'patient' || $consultation->patient_id !== $user->id) {
            return Response::denyAsNotFound();
        }

        return $consultation->payment_status === 'pending'
            ? Response::allow()
            : Response::deny('A paid consultation cannot be cancelled here. Ask the desk.');
    }

    public function pay(User $user, Consultation $consultation): Response
    {
        if ($user->role !== 'patient' || $consultation->patient_id !== $user->id) {
            return Response::denyAsNotFound();
        }

        return $consultation->payment_status === 'paid'
            ? Response::deny('This consultation is already paid.')
            : Response::allow();
    }

    public function join(User $user, Consultation $consultation): Response
    {
        if (! $this->isParty($user, $consultation)) {
            return Response::denyAsNotFound();
        }

        return $consultation->payment_status === 'paid'
            ? Response::allow()
            : Response::deny('Payment is required before the video call.');
    }

    private function isParty(User $user, Consultation $consultation): bool
    {
        return ($user->role === 'patient' && $consultation->patient_id === $user->id)
            || ($user->role === 'doctor' && $consultation->doctor_id === $user->id);
    }
}
