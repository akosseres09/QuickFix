<?php

namespace common\models\forms;

use common\components\traits\EmailSenderTrait;
use Yii;
use common\models\User;
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
                'filter' => ['status' => User::STATUS_INACTIVE],
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
                'status' => User::STATUS_INACTIVE,
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
