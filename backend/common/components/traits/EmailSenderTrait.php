<?php

namespace common\components\traits;

use Yii;

trait EmailSenderTrait
{
    /**
     * Sends an email to the user.
     *
     * @param \common\models\User $user
     * @return bool whether the email was sent successfully
     */
    public function sendEmail($user, string $htmlView = 'emailVerify-html', string $textView = 'emailVerify-text', string $subject = ''): bool
    {
        if (!$subject) {
            $subject = 'Account registration at ' . Yii::$app->name;
        }

        return Yii::$app
            ->mailer
            ->compose(
                ['html' => $htmlView, 'text' => $textView],
                ['user' => $user]
            )
            ->setFrom([Yii::$app->params['supportEmail'] => Yii::$app->name . ' robot'])
            ->setTo($user->email)
            ->setSubject($subject)
            ->send();
    }
}
