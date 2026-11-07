<?php

declare(strict_types=1);

use App\Enums\ModerationReason;

return [
    'reasons' => ModerationReason::options(),
    'prohibited_ingredients' => [
        'pork', 'lard', 'bacon', 'ham', 'gelatin', 'alcohol', 'wine', 'beer',
        'baboy', 'mantika ng baboy', 'alak',
    ],
    'halal_keywords' => [
        'halal', 'certified halal', 'halal certified',
    ],
    'expiring_notice_days' => 30,
];
