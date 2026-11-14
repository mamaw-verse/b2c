<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AffiliateProfile;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

final class CaptureAffiliateReferral
{
    public function handle(Request $request, Closure $next): Response
    {
        $ref = $request->query('ref');

        if (is_string($ref) && $ref !== '') {
            $profile = AffiliateProfile::active()->where('code', $ref)->first();

            if ($profile !== null) {
                Cookie::queue('affiliate_ref', $profile->code, 43200);
            }
        }

        return $next($request);
    }
}
