<?php

declare(strict_types=1);

namespace App\Support;

final class Money
{
    /**
     * Format integer centavos as pesos: whole pesos get thousands separators
     * with no decimals; non-zero centavos get two decimal places.
     */
    public static function format(int $centavos): string
    {
        $decimals = $centavos % 100 === 0 ? 0 : 2;
        $formatted = '₱'.number_format(abs($centavos) / 100, $decimals);

        return $centavos < 0 ? '-'.$formatted : $formatted;
    }
}
