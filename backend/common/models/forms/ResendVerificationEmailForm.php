<?php

namespace common\models\forms;

use common\components\traits\EmailSenderTrait;
use Yii;
use common\models\User;
use common\models\UserStatus;
use yii\base\Model;

class ResendVerificationEmailForm extends Model
{
    use EmailSenderTrait;

    /**
     * @var string
     */
    public $email;


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
                'filter' => ['status' => UserStatus::INACTIVE->value],
                'message' => 'There is no user with this email address.'
            ],
        ];
    }

    /**
     * Sends confirmation email to user
     *
     * @return bool whether the email was sent
     */
    public function send(User|null $user = null)
    {
        if ($user === null) {
            $user = User::findOne([
                'status' => UserStatus::INACTIVE->value,
                'email' => $this->email,
            ]);
        }

        if (!$user) {
            return false;
        }

        $user->generateEmailVerificationToken();
        $user->setEmailTokenExpireDate();

        return $user->save() && $this->sendEmail($user);
    }
}
