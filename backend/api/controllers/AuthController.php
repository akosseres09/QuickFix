<?php

namespace api\controllers;


use api\components\ResponseMaker;
use common\models\SignupForm;
use frontend\models\VerifyEmailForm;
use yii\base\InvalidArgumentException;
use yii\filters\Cors;
use yii\rest\Controller;
use yii\web\BadRequestHttpException;
use yii\web\Response;

class AuthController extends Controller
{

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

    public function actionSignup(): array {

        $form = new SignupForm();
        if ($form->load(\Yii::$app->request->getBodyParams(), '') && $form->signup()) {
            \Yii::$app->response->statusCode = 200;
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
        try {
            $model = new VerifyEmailForm($token);
        } catch (InvalidArgumentException $e) {
            throw new BadRequestHttpException($e->getMessage());
        }

        if ($model->verifyEmail()) {
            return ResponseMaker::asSuccess([
                'success' => true
            ]);
        }

        return ResponseMaker::asError('Unable to verify your account!');
    }

    public function actionResetPassword(): array {
        return [];
    }

}
