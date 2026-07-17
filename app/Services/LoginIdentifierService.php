<?php

namespace App\Services;

use App\Models\User;

class LoginIdentifierService
{
    public function __construct(private PhoneNumberService $phoneNumbers)
    {
    }

    /**
     * Workers log in with their local phone number (no +970/+972 country
     * code); admin still logs in with email. Shared by web AuthController
     * and mobile Api\AuthController so both accept the same input formats.
     */
    public function resolveEmail(string $identifier): ?string
    {
        if (str_contains($identifier, '@')) {
            return $identifier;
        }

        return User::where('phone', $this->phoneNumbers->normalize($identifier))->value('email');
    }
}
