<?php

namespace common\models;

use common\jobs\SendInvitationEmailJob;
use common\models\query\OrganizationInvitationQuery;
use common\models\resource\UserResource;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\behaviors\BlameableBehavior;
use yii\behaviors\TimestampBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * @property string $id
 * @property string $organization_id
 * @property string $inviter_id
 * @property string $email
 * @property int $role
 * @property int $status
 * @property string $token
 * @property int $expires_at
 * @property int $created_at
 * @property int $updated_at
 * 
 * @property UserResource $inviter
 * @property Organization $organization
 * 
 */
class OrganizationInvitation extends ActiveRecord
{
    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REVOKED = 'revoked';
    const STATUS_REJECTED = 'rejected';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_ACCEPTED,
        self::STATUS_REJECTED,
        self::STATUS_REVOKED
    ];

    const EXPIRATION_LENGTH = 7 * 24 * 60 * 60; // 7 days

    public static function tableName()
    {
        return '{{%organization_invitation}}';
    }

    public function behaviors(): array
    {
        return [
            TimestampBehavior::class,
            [
                'class' => BlameableBehavior::class,
                'updatedByAttribute' => false,
                'createdByAttribute' => 'inviter_id'
            ]
        ];
    }

    public function rules(): array
    {
        return [
            [['organization_id', 'role', 'email'], 'required'],
            ['organization_id', 'exist', 'targetClass' => Organization::class, 'targetAttribute' => ['organization_id' => 'id']],
            ['inviter_id', 'exist', 'targetClass' => UserResource::class, 'targetAttribute' => ['inviter_id' => 'id']],
            ['email', 'email'],
            [
                'email',
                function ($attribute) {
                    $currentUserEmail = Yii::$app->user->identity->email;

                    if ($this->$attribute === $currentUserEmail) {
                        $this->addError($attribute, 'You cannot invite yourself to an organization.');
                    }
                }
            ],
            ['status', 'string', 'max' => 64],
            ['status', 'in', 'range' => self::STATUSES],
            ['status', 'default', 'value' => self::STATUS_PENDING],
            ['role', 'string', 'max' => 16],
            ['role', 'default', 'value' => OrganizationMember::ROLE_VIEWER],
            ['role', 'in', 'range' => OrganizationMember::ROLE_LIST],
            [
                ['email', 'organization_id'],
                'unique',
                'targetAttribute' => ['email', 'organization_id'],
                'filter' => ['status' => [self::STATUS_PENDING, self::STATUS_ACCEPTED]],
                'message' => 'An invitation for this email and organization already exists.',
                'when' => function () {
                    return $this->isNewRecord;
                }
            ]
        ];
    }

    public function fields()
    {
        return [
            'id',
            'organizationId' => 'organization_id',
            'inviterId' => 'inviter_id',
            'email',
            'role',
            'status',
            'token',
            'expiresAt' => 'expires_at',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
        ];
    }

    public function extraFields()
    {
        return [
            'inviter',
            'organization'
        ];
    }

    public function transactions()
    {
        return [
            self::SCENARIO_DEFAULT => self::OP_ALL,
        ];
    }

    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert))
            return false;

        if (!$insert)
            return true;

        $this->id = Uuid::v7()->toString();
        $this->token = Yii::$app->security->generateRandomString(36);
        $this->expires_at = time() + self::EXPIRATION_LENGTH;
        return true;
    }

    public function afterSave($insert, $changedAttributes)
    {
        parent::afterSave($insert, $changedAttributes);

        if ($insert) {
            Yii::$app->queue->push(new SendInvitationEmailJob([
                'invitationId' => $this->id,
            ]));
        }

        if ($changedAttributes['status'] === self::STATUS_PENDING && $this->status === self::STATUS_ACCEPTED) {
            $member = new OrganizationMember();
            $member->organization_id = $this->organization_id;
            $member->user_id = UserResource::find()->select('id')->where(['email' => $this->email])->scalar();
            $member->role = $this->role;
            if (!$member->save()) {
                $errors = json_encode($member->getErrors());
                Yii::error("Failed to create project owner. Errors: " . $errors, __METHOD__);
                throw new \yii\db\Exception("Transaction aborted: Could not save Project Member. " . $errors);
            }
        }
    }

    public function getInviter(): ActiveQuery
    {
        return $this->hasOne(UserResource::class, ['id' => 'inviter_id']);
    }

    public function getOrganization(): ActiveQuery
    {
        return $this->hasOne(Organization::class, ['id' => 'organization_id']);
    }

    public static function find(): OrganizationInvitationQuery
    {
        return new OrganizationInvitationQuery(get_called_class());
    }

    public function isExpired(): bool
    {
        return time() > $this->expires_at;
    }

    public function isPending()
    {
        return $this->status === self::STATUS_PENDING;
    }
}
