<?php

namespace api\components;

use api\models\UserRefreshToken;
use DateTimeImmutable;
use Lcobucci\JWT\UnencryptedToken;
use Yii;
use yii\web\ServerErrorHttpException;
use yii\web\UnauthorizedHttpException;

trait RefreshTokenHandlerTrait
{
    protected function getExpiredRefreshToken(string $token)
    {
        return UserRefreshToken::find()
            ->byIp(Yii::$app->request->getUserIP())
            ->byToken($token);
    }

    protected function getRefreshToken(string $token, bool $withUser = true): UserRefreshToken
    {
        $ip = Yii::$app->request->getUserIP();
        $query = UserRefreshToken::find()
            ->byToken($token)
            ->notRevoked()
            ->byIp($ip);

        if ($withUser && false) {
            $query->with('user');
        }

        $refreshToken = $query->one();
        return $refreshToken;
    }

    protected function validateRefreshToken(UserRefreshToken $refreshToken)
    {
        if ($refreshToken->isRevoked() || !$refreshToken->isValid()) {
            throw new UnauthorizedHttpException('Refresh token is revoked.');
        }
    }

    protected function createToken(int $userId): UnencryptedToken
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
            ->expiresAt($now->modify('+ 5 minutes'))
            ->withClaim('uid', $userId)
            ->getToken($this->jwtConfig->signer(), $this->jwtConfig->signingKey());
    }

    /**
     * Creates or updates a refresh token for the user.
     * If $credential is an instance of UserRefreshToken, it updates the existing token.
     * If $credential is an integer (user ID), it creates a new refresh token.
     * Both cases will add the token to the response cookies.
     */
    protected function createRefreshToken(int|UserRefreshToken $credential, int $expiresInSeconds = 300): UserRefreshToken
    {
        $token = Yii::$app->security->generateRandomString(64);
        $ip = Yii::$app->request->getUserIP();
        $agent = Yii::$app->request->getUserAgent();

        // updates existing & not revoked refresh token and adds it to cookie
        if ($credential instanceof UserRefreshToken) {
            if ($credential->isRevoked()) {
                throw new UnauthorizedHttpException('Refresh token is revoked.');
            }

            $credential->expires_at = time() + $expiresInSeconds;
            $credential->token = $token;
            $credential->ip = $ip;
            $credential->user_agent = $agent;
            if (!$credential->save()) {
                throw new ServerErrorHttpException(
                    'Failed to update existing refresh token: ' . implode(', ', $credential->getFirstErrors())
                );
            }

            $this->addToCookie($credential->token);
            return $credential;
        }

        $refreshToken = UserRefreshToken::find()
            ->byUserId($credential)
            ->byIp($ip)
            ->one();

        if (!$refreshToken) {
            $refreshToken = new UserRefreshToken([
                'user_id' => $credential,
                'token' => $token,
                'ip' => $ip,
                'user_agent' => $agent,
                'expires_at' => time() + $expiresInSeconds,
            ]);

            if (!$refreshToken->save()) {
                throw new ServerErrorHttpException(
                    'Failed to create refresh token: ' . implode(', ', $refreshToken->getFirstErrors())
                );
            }
        }

        if (!$refreshToken->isValid()) {
            $refreshToken->token = $token;
            $refreshToken->expires_at = time() + $expiresInSeconds;

            if (!$refreshToken->save()) {
                throw new ServerErrorHttpException(
                    'Failed to update refresh token: ' . implode(', ', $refreshToken->getFirstErrors())
                );
            }
        }

        $this->addToCookie($refreshToken->token);

        return $refreshToken;
    }

    protected function addToCookie(string $token)
    {
        if (Yii::$app->response->cookies->has('refresh-token')) {
            Yii::$app->response->cookies->remove('refresh-token');
        }

        Yii::$app->response->cookies->add(new \yii\web\Cookie([
            'name' => 'refresh-token',
            'value' => $token,
            'httpOnly' => true,
            'sameSite' => 'none',
            'path' => '/auth'
        ]));
    }
}
