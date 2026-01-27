<?php

namespace common\models;

use api\models\UserRefreshToken;
use common\models\query\UserQuery;
use Lcobucci\JWT\UnencryptedToken;
use Throwable;
use Yii;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveRecord;
use yii\web\IdentityInterface;

/**
 * User model
 *
 * @property string $id
 * @property string $username
 * @property string $password_hash
 * @property string $password_reset_token
 * @property string $verification_token
 * @property string $email
 * @property string $auth_key
 * @property integer $status
 * @property string $first_name
 * @property string $last_name
 * @property string $phone_number
 * @property date $date_of_birth
 * @property string $profile_picture_url
 * @property integer $created_at
 * @property integer $updated_at
 * @property integer $deleted_at
 * @property integer $email_verification_token_expires_at
 * @property integer $password_reset_token_expires_at
 * @property integer $is_admin
 * @property string $password write-only password
 * 
 * relations
 * @property RefreshToken[] $refreshTokens
 */
class User extends ActiveRecord implements IdentityInterface
{
    const STATUS_DELETED = 0;
    const STATUS_INACTIVE = 9;
    const STATUS_ACTIVE = 10;
    const ADMIN = 1;
    const USER = 0;
    const LOGIN_SCENARIO = 'login';
    const SIGNUP_SCENARIO = 'signup';
    const TOKEN_EXPIRE = 3600; // 1 hour

    public function fields(): array
    {
        $fields = [
            'id',
            'username',
            'email',
            'status',
            'isAdmin' => 'is_admin',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'passwordHash' => 'password_hash',
            'firstName' => 'first_name',
            'lastName' => 'last_name',
            'phoneNumber' => 'phone_number',
            'dateOfBirth' => 'date_of_birth',
            'profilePictureUrl' => 'profile_picture_url',
        ];

        if ($this->getScenario() === self::SCENARIO_DEFAULT) {
            unset($fields['password_hash']);
        }

        return $fields;
    }

    /**
     * {@inheritdoc}
     */
    public static function tableName(): string
    {
        return '{{%user}}';
    }

    /**
     * {@inheritdoc}
     */
    public function behaviors(): array
    {
        return [
            TimestampBehavior::class,
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function beforeSave($insert)
    {
        if (parent::beforeSave($insert)) {
            if ($insert && empty($this->id)) {
                $this->id = Yii::$app->security->generateRandomString(36);
            }
            return true;
        }
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function rules(): array
    {
        return [
            [['username', 'password_reset_token', 'auth_key', 'email'], 'unique'],
            [['auth_key', 'username', 'password_hash', 'email', 'first_name', 'last_name'], 'required'],
            [['auth_key'], 'string', 'max' => 32],
            [['email'], 'email'],
            [['email', 'password_hash', 'username', 'password_reset_token', 'verification_token', 'first_name', 'last_name', 'phone_number'], 'string', 'max' => 255],
            ['is_admin', 'default', 'value' => self::USER],
            ['is_admin', 'in', 'range' => [self::USER, self::ADMIN]],
            ['status', 'default', 'value' => self::STATUS_INACTIVE],
            ['status', 'in', 'range' => [self::STATUS_ACTIVE, self::STATUS_INACTIVE]],
            [['created_at', 'updated_at', 'deleted_at', 'email_verification_token_expires_at'], 'integer'],
            [['date_of_birth'], 'date', 'format' => 'php:Y-m-d'],
        ];
    }


    public static function find(): UserQuery
    {
        return new UserQuery(get_called_class());
    }

    /**
     * {@inheritdoc}
     */
    public static function findIdentity($id)
    {
        return static::findOne(['id' => $id, 'status' => self::STATUS_ACTIVE, 'deleted_at' => null]);
    }

    /**
     * {@inheritdoc}
     */
    public static function findIdentityByAccessToken($token, $type = null)
    {
        try {
            $config = Yii::$app->get('jwt');

            $parsedToken = $config->parser()->parse($token);
            assert($parsedToken instanceof UnencryptedToken);

            $constraints = $config->validationConstraints();

            if (!$config->validator()->validate($parsedToken, ...$constraints)) {
                return null;
            }

            $userId = $parsedToken->claims()->get('uid');

            return static::findIdentity($userId);
        } catch (\Throwable $e) {
            Yii::error('Error parsing access token: ' . $e->getMessage(), __METHOD__);
            return null;
        }
    }

    /**
     * Finds user by username
     *
     * @param string $username
     * @return static|null
     */
    public static function findByUsername($username)
    {
        return static::findOne(['username' => $username, 'status' => self::STATUS_ACTIVE]);
    }

    public static function findByEmail($email)
    {
        return static::findOne(['email' => $email, 'status' => self::STATUS_ACTIVE]);
    }

    /**
     * Finds user by password reset token
     *
     * @param string $token password reset token
     * @return static|null
     */
    public static function findByPasswordResetToken($token)
    {
        return static::findOne([
            'password_reset_token' => $token,
            'status' => self::STATUS_ACTIVE,
        ]);
    }


    public static function findByVerificationToken(string $token)
    {
        return User::find()->byEmailVerificationToken($token)->inactive()->one();
    }

    /**
     * Finds out if password reset token is valid
     *
     * @param string $token password reset token
     * @return bool
     */
    public function isPasswordResetTokenValid()
    {
        if (empty($this->password_reset_token)) {
            return false;
        }

        return time() < $this->password_reset_token_expires_at;
    }

    public function getRefreshTokens()
    {
        return $this->hasMany(UserRefreshToken::class, ['user_id' => 'id']);
    }

    /**
     * {@inheritdoc}
     */
    public function getId()
    {
        return $this->getPrimaryKey();
    }

    /**
     * {@inheritdoc}
     */
    public function getAuthKey()
    {
        return $this->auth_key;
    }

    public function getEmailToken(): string
    {
        return $this->verification_token;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE && $this->deleted_at === null;
    }

    /**
     * {@inheritdoc}
     */
    public function validateAuthKey($authKey)
    {
        return $this->getAuthKey() === $authKey;
    }

    /**
     * Validates password
     *
     * @param string $password password to validate
     * @return bool if password provided is valid for current user
     */
    public function validatePassword($password)
    {
        return Yii::$app->security->validatePassword($password, $this->password_hash);
    }

    /**
     * Generates password hash from password and sets it to the model
     *
     * @param string $password
     */
    public function setPassword($password)
    {
        $this->password_hash = Yii::$app->security->generatePasswordHash($password);
    }

    /**
     * Generates "remember me" authentication key
     */
    public function generateAuthKey()
    {
        $this->auth_key = Yii::$app->security->generateRandomString();
    }

    /**
     * Generates new password reset token and sets expiration date
     */
    public function generatePasswordResetToken()
    {
        $this->password_reset_token = Yii::$app->security->generateRandomString();
        $this->password_reset_token_expires_at = time() + self::TOKEN_EXPIRE;
    }

    /**
     * Generates new token for email verification and sets expiration date
     */
    public function generateEmailVerificationToken()
    {
        $this->verification_token = Yii::$app->security->generateRandomString() . '_' . time();
        $this->email_verification_token_expires_at = time() + self::TOKEN_EXPIRE;
    }

    /**
     * Checks if email verification token is expired
     */
    public function isEmailTokenExpired(): bool
    {
        return time() > $this->email_verification_token_expires_at;
    }

    /**
     * Removes email verification token and its expiration date
     */
    public function removeEmailVerifyToken(): void
    {
        $this->verification_token = null;
        $this->email_verification_token_expires_at = null;
    }

    /**
     * Removes password reset token and its expiration date
     */
    public function removePasswordResetToken()
    {
        $this->password_reset_token = null;
        $this->password_reset_token_expires_at = null;
    }

    public function setProfilePictureUrl(): void
    {
        $this->profile_picture_url = 'https://ui-avatars.com/api/?name=' . urlencode($this->first_name . ' ' . $this->last_name) . '&background=random&size=256';
    }
}
