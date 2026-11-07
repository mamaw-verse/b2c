<?php

declare(strict_types=1);

namespace App\Enums;

enum ModerationReason: string
{
    // Halal reasons
    case HalalCertificateExpired = 'halal_certificate_expired';
    case HalalCertificateExpiring = 'halal_certificate_expiring';
    case HalalCertificateMissing = 'halal_certificate_missing';
    case HalalKeywordWithoutCertificate = 'halal_keyword_without_certificate';
    case ProhibitedIngredient = 'prohibited_ingredient';
    case LogoMisuse = 'logo_misuse';
    // Report-driven reasons
    case MisleadingContent = 'misleading_content';
    case InappropriateContent = 'inappropriate_content';
    case Spam = 'spam';
    case CounterfeitGoods = 'counterfeit_goods';
    case Other = 'other';

    /** @return array<string, string> */
    public static function options(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn (self $r) => [$r->value => $r->label()])
            ->all();
    }

    public function label(): string
    {
        return match ($this) {
            self::HalalCertificateExpired => 'Halal certificate expired',
            self::HalalCertificateExpiring => 'Halal certificate expiring soon',
            self::HalalCertificateMissing => 'Halal certificate missing',
            self::HalalKeywordWithoutCertificate => '"Halal" claim without certificate',
            self::ProhibitedIngredient => 'Contains prohibited ingredient',
            self::LogoMisuse => 'Halal logo misuse',
            self::MisleadingContent => 'Misleading content',
            self::InappropriateContent => 'Inappropriate content',
            self::Spam => 'Spam',
            self::CounterfeitGoods => 'Counterfeit goods',
            self::Other => 'Other',
        };
    }

    public function isHalalReason(): bool
    {
        return in_array($this, [
            self::HalalCertificateExpired,
            self::HalalCertificateExpiring,
            self::HalalCertificateMissing,
            self::HalalKeywordWithoutCertificate,
            self::ProhibitedIngredient,
            self::LogoMisuse,
        ], true);
    }
}
