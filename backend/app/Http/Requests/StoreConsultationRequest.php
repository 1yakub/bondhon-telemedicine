<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // the route already runs can:create; this request only validates input
        return true;
    }

    public function rules(): array
    {
        return [
            'doctor_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'doctor')],
            'patient_symptoms' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return ['doctor_id.exists' => 'That doctor is not available.'];
    }
}
