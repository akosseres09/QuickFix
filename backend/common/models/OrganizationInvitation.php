<?php

namespace common\models;

use api\components\permissions\RoleManager;
use common\components\traits\EmailSenderTrait;
use common\models\query\OrganizationInvitationQuery;
use common\models\resource\UserResource;
use DateTimeImmutable;
use Lcobucci\JWT\Configuration;
use Symfony\Component\Uid\Uuid;
use Yii;
use yii\db\ActiveQuery;

/**
 * @property string $id
 * @property string $organization_id
 * @property string $inviter_id
 * @property string $email
 * @property int $role
 * @property int $status
 * @property int $expires_at
 * @property int $created_at
 * @property int $updated_at
 * 
 * @property UserResource $inviter
 * @property Organization $organization
 * 
 */
class OrganizationInvitation extends BaseModel
{
    use EmailSenderTrait;

    public string $token = '';
    protected string|bool $blameableCreatedByAttribute = 'inviter_id';
    protected string|bool $blameableUpdatedByAttribute = false;
    private Configuration $jwtConfig;


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

    public function init()
    {
        $this->jwtConfig = Yii::$app->get('jwt');
        return parent::init();
    }

    public static function tableName()
    {
        return '{{%organization_invitation}}';
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
                    if (!$this->isNewRecord) {
                        return;
                    }

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
            ['role', 'default', 'value' => RoleManager::ROLE_GUEST],
            ['role', 'in', 'range' => RoleManager::ROLE_LIST],
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
        $this->expires_at = time() + self::EXPIRATION_LENGTH;
        return true;
    }

    public function afterSave($insert, $changedAttributes)
    {
        parent::afterSave($insert, $changedAttributes);

        if ($insert) {
            $this->sendInvitationEmail();
            return;
        }

        // On acceptance: Assign them to the Org and the Public Projects
        $wasPending = isset($changedAttributes['status']) && $changedAttributes['status'] === self::STATUS_PENDING;
        $isNowAccepted = $this->status === self::STATUS_ACCEPTED;

        if (!$insert && $wasPending && $isNowAccepted) {
            $userId = UserResource::find()->select('id')->where(['email' => $this->email])->scalar();

            if (!$userId) {
                throw new \yii\web\ServerErrorHttpException("Cannot accept invitation: User does not exist.");
            }

            $this->createOrganizationMember($userId);
            $this->createProjectMemberForPublicProjects($userId);
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

    private function sendInvitationEmail()
    {
        $invitation = OrganizationInvitation::find()
            ->byId($this->id)
            ->joinWith('organization')
            ->joinWith('inviter')
            ->one();

        // If the invite was somehow deleted before the queue processed it, just exit gracefully.
        if (!$invitation) {
            Yii::warning("Invitation ID {$this->id} not found. Skipping email.", 'queue');
            return;
        }

        $token = $this->generateInvitationToken();
        $id = $invitation->id;
        $frontendUrl = Yii::$app->params['frontendUrl'] ?? 'http://localhost:4200';
        $inviteLink = "$frontendUrl/invitation/$id?invitationToken=$token";

        $this->queueEmail(
            $invitation->email,
            "You have been invited to join an organization!",
            'invite',
            [
                'inviteLink' => $inviteLink,
                'inviter' => $invitation->inviter->getFullName(),
                'organization' => $invitation->organization->name,
            ]
        );
    }

    private function generateInvitationToken(): string
    {
        $time = new DateTimeImmutable();
        $issuer = Yii::$app->params['backendUrl'] ?? 'http://api.ticketing.test';
        $audience = Yii::$app->params['frontendUrl'] ?? 'http://localhost:4200';

        $emailExists = User::find()->where(['email' => $this->email])->exists();

        return $this->jwtConfig->builder()
            ->issuedBy($issuer)
            ->permittedFor($audience)
            ->identifiedBy(bin2hex(random_bytes(16)))
            ->issuedAt($time)
            ->canOnlyBeUsedAfter($time)
            ->expiresAt($time->modify('+' . self::EXPIRATION_LENGTH . ' seconds'))
            ->withClaim('email', $this->email)
            ->withClaim('emailExists', $emailExists)
            ->withClaim('orgId', $this->organization_id)
            ->getToken($this->jwtConfig->signer(), $this->jwtConfig->signingKey())
            ->toString();
    }

    /**
     * Creates an OrganizationMember record for the user accepting the invitation,
     * with the role specified in the invitation.
     * Used by [[OrganizationInvitatio::afterSave()]] after accepting an invitation, 
     * to add the user to the organization with the correct role.
     */
    private function createOrganizationMember($userId)
    {
        $member = new OrganizationMember();
        $member->organization_id = $this->organization_id;
        $member->user_id = $userId;
        $member->role = $this->role;

        if (!$member->save()) {
            $errors = json_encode($member->getErrors());
            Yii::error("Failed to create org member. Errors: " . $errors, __METHOD__);
            throw new \yii\db\Exception("Transaction aborted: Could not save Organization Member. " . $errors);
        }
    }

    /**
     * Creates ProjectMember records for all public projects in the organization 
     * that the user is not already a member of.
     * 
     * Used by [[OrganizationInvitatio::afterSave()]] after accepting an invitation, 
     * to ensure that new members are added to all public projects in the org automatically.
     */
    private function createProjectMemberForPublicProjects($userId)
    {
        $existingProjectIds = ProjectMember::find()
            ->select('project_id')
            ->byUser($userId);

        $publicProjectIds = Project::find()
            ->select('id')
            ->byOrganizationId($this->organization_id)
            ->byVisibility(Project::VISIBILITY_PUBLIC)
            ->andWhere(['not in', 'id', $existingProjectIds])
            ->column();

        if (empty($publicProjectIds)) {
            return;
        }

        $rows = [];
        $time = time();

        foreach ($publicProjectIds as $projectId) {
            $rows[] = [
                Uuid::v7()->toString(),
                $projectId,
                $userId,
                RoleManager::ROLE_MEMBER,
                $time,
            ];
        }

        try {
            Yii::$app->db->createCommand()
                ->batchInsert(
                    ProjectMember::tableName(),
                    ['id', 'project_id', 'user_id', 'role', 'created_at'],
                    $rows
                )
                ->execute();
        } catch (\Exception $e) {
            Yii::error("Failed to create project members for public projects. Error: " . $e->getMessage(), __METHOD__);
            throw new \yii\db\Exception("Transaction aborted: Could not save Project Members for public projects. " . $e->getMessage());
        }
    }
}
