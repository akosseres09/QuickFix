<?php

namespace api\controllers;


use Yii;
use api\components\ResponseMaker;
use common\components\traits\EmailSenderTrait;
use common\models\SignupForm;
use common\models\User;
use yii\filters\Cors;
use yii\rest\Controller;
use yii\web\BadRequestHttpException;
use yii\web\NotFoundHttpException;
use yii\web\Response;

class AuthController extends Controller
{

    use EmailSenderTrait;

    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        unset($behaviors['authenticator']);
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => ['*'],
                'Access-Control-Request-Method' => ['POST', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['Content-Type', 'Authorization'],
                'Access-Control-Allow-Credentials' => null, // Set to true if you need to send cookies with the request
                'Access-Control-Max-Age' => 86400, // 24 hours
                'Access-Control-Expose-Headers' => [],
            ],
        ];
        $behaviors['contentNegotiator']['formats']['text/html'] = Response::FORMAT_JSON;

        return $behaviors;
    }

    protected function verbs(): array
    {
        return [
            '*' => ['POST', 'OPTIONS'],
        ];
    }


    public function actionLogin(): array
    {
        // Implement login logic here
        return ['message' => 'Login successful'];
    }

    public function actionLogout(): array
    {
        // Implement logout logic here
        return ['message' => 'Logout successful'];
    }

    public function actionSignup(): array
    {

        $form = new SignupForm();
        if ($form->load(\Yii::$app->request->getBodyParams(), '') && $form->signup()) {
            return  ResponseMaker::asSuccess([
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
        $token = \Yii::$app->request->post('token');

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

        $email = \Yii::$app->request->post('email');

        if (!$email) {
            throw new BadRequestHttpException('Email is required to resend verification email.');
        }

        $user = User::find()->byEmail($email)->inactive()->one();

        if (!$user) {
            throw new NotFoundHttpException('No user found to email!', 410);
        }

        $user->generateEmailVerificationToken();
        $user->setEmailTokenExpireDate();

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

        $email = \Yii::$app->request->post('email');
        $token = \Yii::$app->request->post('token');

        // send the reset password email if email is provided and token is not provided
        // otherwise, reset the password using the token
        if ($email && !$token) {
            $user = User::find()->byEmail($email)->active()->one();

            if (!$user) {
                throw new NotFoundHttpException('No user found with this email.', 410);
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

        $newPassword = \Yii::$app->request->post('password');


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
