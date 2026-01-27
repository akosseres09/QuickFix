<?php

namespace api\components;

use api\models\UserRefreshToken;
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

    protected function getRefreshToken(string $token, bool $withUser = true): UserRefreshToken | null
    {
        $ip = Yii::$app->request->getUserIP();
        $query = UserRefreshToken::find()
            ->byToken($token)
            ->notRevoked()
            ->byIp($ip);

        if ($withUser) {
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

    /**
     * Creates or updates a refresh token for the user.
     * If $credential is an instance of UserRefreshToken, it updates the existing token.
     * If $credential is a string (user ID), it creates a new refresh token.
     * Both cases will add the token to the response cookies.
     */
    protected function createRefreshToken(string|UserRefreshToken $credential, int $expiresInSeconds = 300): UserRefreshToken | null
    {
        $credentialOptions = [
            'token' => Yii::$app->security->generateRandomString(64),
            'expiresInSeconds' => $expiresInSeconds,
            'ip' => Yii::$app->request->getUserIP(),
            'agent' => Yii::$app->request->getUserAgent(),
        ];

        if ($credential instanceof UserRefreshToken) {
            return $this->updateExistingRefreshToken($credential, $credentialOptions);
        }

        $refreshToken = UserRefreshToken::find()
            ->byUserId($credential)
            ->byIp($credentialOptions['ip'])
            ->one();

        if (!$refreshToken) {
            $refreshToken = $this->createNewRefreshToken($credential, $credentialOptions);
        }

        if (!$refreshToken->isValid()) {
            $refreshToken = $this->updateRefreshTokenExpiry($refreshToken, $credentialOptions);
        }

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
            'sameSite' => \yii\web\Cookie::SAME_SITE_LAX,
            'secure' => false,
            'path' => '/',
            'domain' => '',
        ]));
    }

    /**
     * Creates a new refresh token based on an existing one.
     * If the existing token is revoked, an exception is thrown.
     * @param UserRefreshToken $credential
     * @param array $credentialOptions  
     *    ['token' => string, 'expiresInSeconds' => int, 'ip' => string, 'agent' => string ]
     * @return UserRefreshToken
     */
    private function updateExistingRefreshToken(UserRefreshToken $credential, array $credentialOptions): UserRefreshToken
    {
        if ($credential->isRevoked()) {
            throw new UnauthorizedHttpException('Refresh token is revoked.');
        }

        $credential->expires_at = time() + $credentialOptions['expiresInSeconds'];
        $credential->token = $credentialOptions['token'];
        $credential->ip = $credentialOptions['ip'];
        $credential->user_agent = $credentialOptions['agent'];
        if (!$credential->save()) {
            throw new ServerErrorHttpException(
                'Failed to update existing refresh token: ' . implode(', ', $credential->getFirstErrors())
            );
        }

        return $credential;
    }

    /**
     * Creates a new refresh token for the given user ID.
     * @param int $credential
     * @param array $credentialOptions  
     *    ['token' => string, 'expiresInSeconds' => int, 'ip' => string, 'agent' => string ]
     * @return UserRefreshToken
     */
    private function createNewRefreshToken(string $credential, array $credentialOptions): UserRefreshToken
    {
        $refreshToken = new UserRefreshToken([
            'user_id' => $credential,
            'token' => $credentialOptions['token'],
            'ip' => $credentialOptions['ip'],
            'user_agent' => $credentialOptions['agent'],
            'expires_at' => time() + $credentialOptions['expiresInSeconds'],
        ]);

        if (!$refreshToken->save()) {
            throw new ServerErrorHttpException(
                'Failed to create refresh token: ' . implode(', ', $refreshToken->getFirstErrors())
            );
        }

        return $refreshToken;
    }

    /**
     * Updates an existing refresh token with new token value and expiry.
     * @param UserRefreshToken $refreshToken
     * @param array $tokenOptions  
     *    ['token' => string, 'expiresInSeconds' => int ]
     * @return UserRefreshToken
     */
    private function updateRefreshTokenExpiry(UserRefreshToken $refreshToken, array $tokenOptions)
    {
        $refreshToken->token = $tokenOptions['token'];
        $refreshToken->expires_at = time() + $tokenOptions['expiresInSeconds'];

        if (!$refreshToken->save()) {
            throw new ServerErrorHttpException(
                'Failed to update refresh token: ' . implode(', ', $refreshToken->getFirstErrors())
            );
        }

        return $refreshToken;
    }
}
