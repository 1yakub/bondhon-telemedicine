<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route middleware with parameters, the pattern from the Laravel middleware docs:
 * Route::middleware('role:admin') or 'role:patient,doctor'.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            abort(403, 'This action is not allowed for your account.');
        }

        return $next($request);
    }
}
