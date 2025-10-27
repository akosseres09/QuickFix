<?php

namespace api\models;

use api\models\query\UserRefreshTokenQuery;
use common\models\User;
use Yii;
use yii\db\ActiveRecord;

/**
 * This is the model class for table "{{%user_refresh_token}}".
 *
 * @property int $id
 * @property int $user_id
 * @property string $token
 * @property string|null $ip
 * @property string|null $user_agent
 * @property int $created_at
 * @property int $expires_at
 * @property int $revoked_at
 * 
 * relations
 * @property User $user
 */
class UserRefreshToken extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%user_refresh_token}}';
    }

    public function rules(): array
    {
        return [
            [['user_id', 'token', 'expires_at'], 'required'],
            [['user_id', 'expires_at', 'created_at'], 'integer'],
            [['ip'], 'string', 'max' => 45],
            [['user_agent'], 'string'],
            [['token'], 'unique'],
        ];
    }

    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'user_id' => 'User ID',
            'token' => 'Token',
            'ip' => 'IP Address',
            'user_agent' => 'User Agent',
            'created_at' => 'Created At',
            'expires_at' => 'Expires At',
            'revoked_at' => 'Revoked At',
        ];
    }

    public function behaviors()
    {
        return [
            'timestamp' => [
                'class' => \yii\behaviors\TimestampBehavior::class,
                'createdAtAttribute' => 'created_at',
                'updatedAtAttribute' => false,
            ],
        ];
    }

    public static function find(): UserRefreshTokenQuery
    {
        return new UserRefreshTokenQuery(get_called_class());
    }

    public function getUser()
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    public function isValid(): bool
    {
        return $this->expires_at > time() && $this->revoked_at === null;
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }
}
