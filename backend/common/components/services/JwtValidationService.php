<?php

namespace common\components\services;

use Lcobucci\JWT\UnencryptedToken;
use Throwable;
use Yii;

class JwtValidationService
{
    private $jwtConfig;

    // Inject the JWT component dependency directly
    public function __construct($jwtConfig)
    {
        $this->jwtConfig = $jwtConfig;
    }

    /**
     * Extracts and validates the User ID from a token string.
     * Returns the UID or null on failure.
     */
    public function getUserIdFromToken(string $token): ?string
    {
        try {
            $parsedToken = $this->jwtConfig->parser()->parse($token);

            if (!$parsedToken instanceof UnencryptedToken) {
                Yii::error('Invalid token type: expected unencrypted token', __METHOD__);
                return null;
            }

            $constraints = $this->jwtConfig->validationConstraints();
            if (!$this->jwtConfig->validator()->validate($parsedToken, ...$constraints)) {
                return null;
            }

            return $parsedToken->claims()->get('uid');
        } catch (Throwable $e) {
            Yii::error('Error parsing access token: ' . $e->getMessage(), __METHOD__);
            return null;
        }
    }
}
