<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Bangladesh mobile numbers: 01XXXXXXXXX, with or without the +88 prefix
        return [
            'phone' => ['required', 'string', 'regex:/^(\+?88)?01[3-9][0-9]{8}$/'],
        ];
    }

    public function messages(): array
    {
        return ['phone.regex' => 'Enter a valid Bangladesh mobile number, like 01712345678.'];
    }

    /** Normalised phone: digits only, no country prefix. */
    public function phone(): string
    {
        $digits = preg_replace('/[^0-9]/', '', (string) $this->input('phone'));

        return str_starts_with($digits, '88') ? substr($digits, 2) : $digits;
    }
}
