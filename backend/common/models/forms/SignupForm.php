<?php

namespace common\models\forms;

use common\models\User;
use yii\base\Model;
use yii\db\Exception;

/**
 * Signup form
 */
class SignupForm extends Model
{
    use \common\components\traits\EmailSenderTrait;

    public $first_name;
    public $last_name;
    public $username;
    public $email;
    public $password;
    public $rePassword;


    /**
     * {@inheritdoc}
     */
    public function rules(): array
    {
        return [
            [['username', 'email', 'first_name', 'last_name'], 'trim'],
            [['username', 'email', 'password', 'rePassword', 'first_name', 'last_name'], 'required'],
            ['username', 'unique', 'targetClass' => '\common\models\User', 'message' => 'This username has already been taken.'],
            ['username', 'string', 'min' => 5, 'max' => 255],
            ['email', 'email'],
            ['email', 'string', 'max' => 255],
            ['email', 'unique', 'targetClass' => '\common\models\User', 'message' => 'This email address has already been taken.'],
            [['password', 'rePassword'], 'string', 'min' => 6],
            ['password', 'compare', 'compareAttribute' => 'rePassword'],
        ];
    }

    /**
     * Signs user up.
     *
     * @return bool whether the creating new account was successful and email was sent
     * @throws Exception
     */
    public function signup(): ?bool
    {
        if (!$this->validate()) {
            return null;
        }

        $user = new User();
        $user->username = $this->username;
        $user->email = $this->email;
        $user->first_name = $this->first_name;
        $user->last_name = $this->last_name;
        $user->setProfilePictureUrl();
        $user->setPassword($this->password);
        $user->generateAuthKey();
        $user->generateEmailVerificationToken();
        $user->email_verification_token_expires_at = time() + 3600;

        return $user->save() && $this->sendVerificationEmail($user);
    }

    /**
     * Sends confirmation email to user
     * @param User $user user model to with email should be send
     * @return bool whether the email was sent
     */
    protected function sendVerificationEmail(User $user): bool
    {
        return $this->sendEmail($user);
    }
}
