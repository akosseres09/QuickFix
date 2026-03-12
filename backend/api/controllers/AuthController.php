<?php

namespace api\controllers;

use Yii;
use api\components\ResponseMaker;
use api\components\traits\AccessTokenHandler;
use api\components\traits\RefreshTokenHandlerTrait;
use common\components\traits\EmailSenderTrait;
use common\models\forms\SignupForm;
use common\models\User;
use yii\filters\Cors;
use yii\rest\Controller;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\Response;
use yii\web\UnauthorizedHttpException;
use Lcobucci\JWT\Configuration;

class AuthController extends Controller
{

    use EmailSenderTrait;
    use RefreshTokenHandlerTrait;
    use AccessTokenHandler;

    public $enableCsrfValidation = false;
    private Configuration $jwtConfig;

    public function init()
    {
        parent::init();
        $this->jwtConfig = Yii::$app->get('jwt');
    }

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        unset($behaviors['authenticator']);
        if (YII_ENV_PROD || !YII_DEBUG) {
            $behaviors['corsFilter'] = [
                'class' => Cors::class,
                'cors' => [
                    'Origin' => ['http://localhost:4200'],
                    'Access-Control-Request-Method' => ['POST', 'OPTIONS'],
                    'Access-Control-Request-Headers' => ['Content-Type', 'Authorization'],
                    'Access-Control-Allow-Credentials' => true, // Set to true if you need to send cookies with the request
                    'Access-Control-Max-Age' => 86400, // 24 hours
                    'Access-Control-Expose-Headers' => [],
                ],
            ];
        }

        $behaviors['contentNegotiator']['formats']['text/html'] = Response::FORMAT_JSON;

        $behaviors['authenticator'] = [
            'class' => \yii\filters\auth\HttpBearerAuth::class,
            'except' => ['login', 'refresh', 'signup', 'verify', 'resend-verification-email', 'reset-password'],
        ];

        return $behaviors;
    }

    protected function verbs(): array
    {
        return [
            '*' => ['POST', 'OPTIONS'],
            'me' => ['GET', 'OPTIONS'],
            'refresh' => ['GET', 'OPTIONS'],
        ];
    }


    public function actionLogin(): array
    {

        $request = Yii::$app->request;
        $username = $request->post('email');
        $password = $request->post('password');

        if (!$username || !$password) {
            throw new BadRequestHttpException('Email and password required.');
        }

        $user = User::findByEmail($username);

        if (!$user || !$user->validatePassword($password)) {
            throw new UnauthorizedHttpException('Invalid credentials.');
        }

        $token = $this->createAccessToken($user->id, $user->is_admin, $user->email);

        $refreshToken = $this->createRefreshToken($user->id);
        $this->addToCookie($refreshToken->token);

        return ResponseMaker::asSuccess([
            'message' => 'Login successful.',
            'access_token' => $token->toString(),
        ]);
    }

    public function actionRefresh(): array
    {
        $cookieRefreshToken = Yii::$app->request->cookies->getValue('refresh-token');

        if (!$cookieRefreshToken) {
            throw new BadRequestHttpException('Refresh token is required.');
        }

        $refreshToken = $this->getRefreshToken($cookieRefreshToken);

        if (!$refreshToken) {
            throw new BadRequestHttpException('Invalid or expired refresh token.');
        }

        if (!$refreshToken->isValid()) {
            $refreshToken = $this->createRefreshToken($refreshToken);
        }

        $user = $refreshToken->user;

        if (!$user) {
            throw new BadRequestHttpException('Invalid user.');
        }

        $token = $this->createAccessToken($user->id, $user->is_admin, $user->email);

        return ResponseMaker::asSuccess([
            'access_token' => $token->toString(),
        ]);
    }

    public function actionLogout()
    {
        $cookieRefreshToken = Yii::$app->request->cookies->getValue('refresh-token');

        if (!$cookieRefreshToken) {
            throw new BadRequestHttpException('Refresh token is required.');
        }

        $refreshToken = $this->getRefreshToken($cookieRefreshToken, false);
        $refreshToken->delete();

        Yii::$app->response->cookies->remove('refresh-token');

        return ResponseMaker::asSuccess(['message' => 'Logged out successfully.']);
    }

    public function actionMe(): array
    {
        /**
         * @var User
         */
        $user = Yii::$app->user->identity;

        if (!$user) {
            throw new UnauthorizedHttpException('User not authenticated.');
        }

        return ResponseMaker::asSuccess([
            'id' => $user->id,
            'email' => $user->email,
            'username' => $user->username,
            'is_admin' => (bool) $user->is_admin,
            'status' => $user->status,
            'created_at' => $user->created_at,
        ]);
    }

    public function actionSignup(): array
    {

        $form = new SignupForm();
        if ($form->load(Yii::$app->request->getBodyParams(), '') && $form->signup()) {
            return ResponseMaker::asSuccess([
                'success' => true
            ]);
        }

        return ResponseMaker::asError('Failed to create User', 405, [
            'error' => $form->getErrors()
        ]);
    }

    /**
     * @throws BadRequestHttpException
     */
    public function actionVerify(): array
    {
        $token = Yii::$app->request->post('token');

        $user = User::findByVerificationToken($token);

        if (!$user) {
            throw new NotFoundHttpException('Invalid verification token.');
        }

        if ($user->isEmailTokenExpired()) {
            throw new BadRequestHttpException('Verification token has expired.');
        }

        $user->removeEmailVerifyToken();
        $user->status = User::STATUS_ACTIVE;

        if ($user->save()) {
            return ResponseMaker::asSuccess([
                'success' => true,
                'message' => 'User verified successfully.'
            ]);
        }

        throw new BadRequestHttpException('Failed to verify user.', 430);
    }

    public function actionResendVerificationEmail(): array
    {

        $email = trim(Yii::$app->request->post('email'));

        if (!$email) {
            throw new BadRequestHttpException('Email is required to resend verification email.');
        }

        $user = User::find()->byEmail($email)->inactive()->one();

        if (!$user) {
            throw new NotFoundHttpException('No inactive account found with this email address!', 410);
        }

        $user->generateEmailVerificationToken();

        if ($user->save() && $this->sendEmail($user)) {
            return ResponseMaker::asSuccess([
                'success' => true,
                'message' => 'Verification email sent successfully.'
            ]);
        }

        throw new BadRequestHttpException('Failed to resend verification email.', 430);
    }

    public function actionResetPassword(): array
    {

        $email = Yii::$app->request->post('email');
        $token = Yii::$app->request->post('token');

        // send the reset password email if email is provided and token is not provided
        // otherwise, reset the password using the token
        if ($email && !$token) {
            $user = User::find()->byEmail($email)->active()->one();

            if (!$user) {
                throw new NotFoundHttpException('No active user found with this email address!', 410);
            }

            $user->generatePasswordResetToken();

            if (
                $user->save() &&
                $this->sendEmail($user, 'passwordResetToken-html', 'passwordResetToken-text', 'Password Reset Request')
            ) {
                return ResponseMaker::asSuccess([
                    'success' => true,
                    'message' => 'Password reset email sent successfully.'
                ]);
            }

            throw new BadRequestHttpException('Failed to send password reset email.', 430);
        }

        if (!$token) {
            throw new BadRequestHttpException('Token is required for password reset.');
        }

        $user = User::findByPasswordResetToken($token);

        if (!$user) {
            throw new NotFoundHttpException('Invalid password reset token.', 410);
        }

        if (!$user->isPasswordResetTokenValid()) {
            throw new BadRequestHttpException('Password reset token has expired.', 400);
        }

        $newPassword = Yii::$app->request->post('password');

        if (!$newPassword) {
            throw new BadRequestHttpException('New password is required.', 400);
        }

        $user->setPassword($newPassword);
        $user->removePasswordResetToken();

        if ($user->save()) {
            return ResponseMaker::asSuccess([
                'success' => true,
                'message' => 'Password reset successfully.'
            ]);
        }

        throw new BadRequestHttpException('Failed to reset password.', 430);
    }
}
