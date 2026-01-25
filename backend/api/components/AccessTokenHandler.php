<?php

namespace api\components;

use Yii;
use DateTimeImmutable;
use Lcobucci\JWT\UnencryptedToken;

trait AccessTokenHandler
{
    /**
     * Creates a JWT access token for the given user details.
     * @param int $userId
     * @param int $role
     * @param string $email
     * @return UnencryptedToken
     */
    protected function createAccessToken(int $userId, int $role, string $email): UnencryptedToken
    {
        $now = new DateTimeImmutable();
        $issuer = Yii::$app->params['backendUrl'] ?? 'http://api.ticketing.test';
        $audience = Yii::$app->params['frontendUrl'] ?? 'http://localhost:4200';

        return $this->jwtConfig->builder()
            ->issuedBy($issuer)
            ->permittedFor($audience)
            ->identifiedBy(bin2hex(random_bytes(16)))
            ->issuedAt($now)
            ->canOnlyBeUsedAfter($now)
            ->expiresAt($now->modify('+ 300 minutes'))
            ->withClaim('uid', $userId)
            ->withClaim('role', $role)
            ->withClaim('email', $email)
            ->getToken($this->jwtConfig->signer(), $this->jwtConfig->signingKey());
    }
}
