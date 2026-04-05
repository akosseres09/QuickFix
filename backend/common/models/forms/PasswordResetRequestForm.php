<?php

namespace common\models\forms;

use common\components\traits\EmailSenderTrait;
use Yii;
use yii\base\Model;
use common\models\User;
use common\models\UserStatus;

/**
 * Password reset request form
 */
class PasswordResetRequestForm extends Model
{
    public $email;
    use EmailSenderTrait;

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            ['email', 'trim'],
            ['email', 'required'],
            ['email', 'email'],
            [
                'email',
                'exist',
                'targetClass' => '\common\models\User',
                'filter' => ['status' => UserStatus::ACTIVE->value],
                'message' => 'There is no user with this email address.'
            ],
        ];
    }

    /**
     * Sends an email with a link, for resetting the password.
     *
     * @return bool whether the email was sent
     */
    public function sendEmail()
    {
        /* @var $user User */
        $user = User::findOne([
            'status' => UserStatus::ACTIVE->value,
            'email' => $this->email,
        ]);

        if (!$user) {
            return false;
        }

        if (!$user->isPasswordResetTokenValid()) {
            $user->generatePasswordResetToken();
            if (!$user->save()) {
                return false;
            }
        }

        $this->queueEmail(
            $this->email,
            'Password reset for ' . Yii::$app->name,
            'passwordResetToken',
            ['user' => $user]
        );

        return true;
    }
}
