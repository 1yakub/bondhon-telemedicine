<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'address' => $this->address,
            'profile_photo' => $this->profile_photo,
            'profile_complete' => filled($this->name),
            'doctor' => $this->whenLoaded('doctor', fn () => $this->doctor ? [
                'specialization' => $this->doctor->specialization,
                'qualifications' => $this->doctor->qualifications,
                'experience_years' => $this->doctor->experience_years,
                'fee_per_consultation' => (string) $this->doctor->fee_per_consultation,
                'is_online' => (bool) $this->doctor->is_online,
            ] : null),
        ];
    }
}
