<?php

declare(strict_types=1);

return [
    'cod_fee' => (int) env('CHECKOUT_COD_FEE', 2000),
    'default_shipping_fee' => (int) env('CHECKOUT_DEFAULT_SHIPPING_FEE', 8000),
    'payment_methods' => [
        ['id' => 'cod', 'label' => 'Cash on Delivery', 'desc' => 'Pay the rider in cash.', 'icon' => 'banknote'],
        ['id' => 'ewallet', 'label' => 'E-wallet', 'desc' => 'GCash, Maya', 'icon' => 'smartphone'],
        ['id' => 'card', 'label' => 'Debit / credit card', 'desc' => 'Visa, Mastercard. Pay in full, no instalment plans.', 'icon' => 'credit-card'],
        ['id' => 'banking', 'label' => 'Online banking', 'desc' => 'Instapay / PESONet partner banks', 'icon' => 'building-2'],
    ],
];
