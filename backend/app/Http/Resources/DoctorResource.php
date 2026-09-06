<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Doctor */
class DoctorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->user_id,
            'name' => $this->user->name,
            'gender' => $this->user->gender,
            'profile_photo' => $this->user->profile_photo,
            'specialization' => $this->specialization,
            'qualifications' => $this->qualifications,
            'experience_years' => $this->experience_years,
            'fee_per_consultation' => (string) $this->fee_per_consultation,
            'is_online' => (bool) $this->is_online,
        ];
    }
}
