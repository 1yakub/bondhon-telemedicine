<?php

namespace App\Http\Requests;

class VerifyOtpRequest extends SendOtpRequest
{
    public function rules(): array
    {
        return parent::rules() + [
            'otp' => ['required', 'digits:6'],
        ];
    }
}
