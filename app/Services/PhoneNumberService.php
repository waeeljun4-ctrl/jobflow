<?php

namespace App\Services;

class PhoneNumberService
{
    /**
     * Normalizes any phone format (with/without +970/+972, spaces, dashes)
     * down to the local format used consistently as a matching key
     * throughout the app (login lookup, customer de-duplication).
     */
    public function normalize(string $input): string
    {
        $digits = preg_replace('/\D+/', '', $input) ?? '';

        if (str_starts_with($digits, '970') || str_starts_with($digits, '972')) {
            $digits = '0'.substr($digits, 3);
        }

        return $digits;
    }
}
