<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * One time codes for patient sign in. The code is stored hashed in the cache for five
 * minutes, keyed by phone, so it does not depend on a session cookie. Brute force is
 * stopped by the route rate limiters, and a wrong code never reveals whether a code exists.
 */
class OtpService
{
    private const TTL_MINUTES = 5;

    /** Creates a code, stores its hash, sends it (or returns it in demo mode). */
    public function issue(string $phone): ?string
    {
        $code = (string) random_int(100000, 999999);
        Cache::put($this->key($phone), Hash::make($code), now()->addMinutes(self::TTL_MINUTES));

        if ($this->shouldSend()) {
            $this->send($phone, $code);

            return null;
        }

        // demo and local: the code is shown on screen instead of sent
        return $code;
    }

    /** True when the code matches; the stored hash is removed on success. */
    public function verify(string $phone, string $code): bool
    {
        $hash = Cache::get($this->key($phone));

        if (! $hash || ! Hash::check($code, $hash)) {
            return false;
        }

        Cache::forget($this->key($phone));

        return true;
    }

    public function shouldSend(): bool
    {
        return config('app.env') === 'production' && config('sms.enabled') && ! config('app.demo');
    }

    private function send(string $phone, string $code): void
    {
        $message = "Your Bondhon verification code is: {$code}. Valid for 5 minutes.";

        $response = Http::timeout(5)->get(config('sms.bulk_sms_bd.base_url'), [
            'api_key' => config('sms.bulk_sms_bd.api_key'),
            'senderid' => config('sms.bulk_sms_bd.sender_id'),
            'number' => $phone,
            'message' => $message,
        ]);

        if (! $response->successful()) {
            Log::warning('SMS gateway did not accept the message', ['phone' => $phone, 'status' => $response->status()]);
        }
    }

    private function key(string $phone): string
    {
        return 'otp:'.$phone;
    }
}
