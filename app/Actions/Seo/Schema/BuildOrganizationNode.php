<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Support\Schema\SchemaId;
use App\Support\SeoData;

final readonly class BuildOrganizationNode
{
    /**
     * Sitewide marketplace Organization. Only properties backed by config are emitted.
     *
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        $contact = config()->array('seo.contact', []);

        $contactPoint = null;
        if (! empty($contact['email']) || ! empty($contact['phone'])) {
            $contactPoint = [
                '@type' => 'ContactPoint',
                'contactType' => 'customer support',
                'email' => $contact['email'] ?? null,
                'telephone' => $contact['phone'] ?? null,
                'areaServed' => config('seo.area_served'),
                'availableLanguage' => ['en', 'fil'],
            ];
        }

        return [
            '@type' => 'Organization',
            '@id' => SchemaId::organization(),
            'name' => (string) config('seo.site_name', 'HalalBenta'),
            'url' => SeoData::canonicalOrigin().'/',
            'logo' => [
                '@type' => 'ImageObject',
                'url' => SeoData::logoUrl(),
                'width' => (int) config('seo.logo_size', 512),
                'height' => (int) config('seo.logo_size', 512),
            ],
            'slogan' => (string) config('seo.slogan'),
            'description' => (string) config('seo.description'),
            'sameAs' => array_values(config()->array('seo.social_profiles', [])),
            'contactPoint' => $contactPoint,
            'areaServed' => config('seo.area_served'),
            'hasMerchantReturnPolicy' => resolve(BuildReturnPolicyNode::class)->handle(),
            'knowsAbout' => config()->array('seo.knows_about', []),
        ];
    }
}
