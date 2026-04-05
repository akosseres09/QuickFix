<?php

namespace api\components\permissions;

use common\models\Organization;
use common\models\OrganizationMember;
use common\models\UserRole;
use Yii;

class OrganizationPermissionService
{
    public static function getBasePermissions(UserRole $userRole): array
    {
        if ($userRole === UserRole::ADMIN) {
            return [
                'base' => [
                    Permissions::ORG_VIEW->value,
                    Permissions::ORG_UPDATE->value,
                    Permissions::ORG_DELETE->value,
                    Permissions::ORG_CREATE->value,
                    Permissions::USER_VIEW->value,
                    Permissions::USER_UPDATE->value,
                    Permissions::USER_DELETE->value,
                ],
            ];
        }

        $elevated = OrganizationMember::find()
            ->select(['organization_id', 'role'])
            ->byUserId(Yii::$app->user->id)
            ->asArray()
            ->all();

        $orgPermissions = [];
        foreach ($elevated as $membership) {
            $orgPermissions = array_merge(
                $orgPermissions,
                self::getOrganizationPermissions(
                    $membership['organization_id'],
                    Yii::$app->user->id,
                    $membership['role']
                )
            );
        }

        return array_merge(['base' => []], $orgPermissions);
    }

    public static function getOrganizationPermissions(
        string $orgId,
        string $userId,
        ?string $role = null
    ): array {
        $org = Organization::find()->byId($orgId)->one();
        if (!$org) return [];

        $role ??= OrganizationMember::find()
            ->select('role')
            ->where(['organization_id' => $org->id, 'user_id' => $userId])
            ->scalar();

        if (!$role) return [];

        $permissions = self::buildOrgPermissionsForRole($role);

        return [
            'org' => [
                $orgId => $permissions,
                $org->slug => $permissions,
            ],
        ];
    }

    public static function canDoInOrganization(string $orgId, string $userId, Permissions $permission): bool
    {
        $permissions = self::getOrganizationPermissions($orgId, $userId);
        return self::orgCan($permissions, $orgId, $permission);
    }

    public static function canViewOrganization(string $orgId, string $userId): bool
    {
        return self::canDoInOrganization($orgId, $userId, Permissions::ORG_VIEW);
    }

    public static function canUpdateOrganization(string $orgId, string $userId): bool
    {
        return self::canDoInOrganization($orgId, $userId, Permissions::ORG_UPDATE);
    }

    public static function canDeleteOrganization(string $orgId, string $userId): bool
    {
        return self::canDoInOrganization($orgId, $userId, Permissions::ORG_DELETE);
    }

    public static function canViewOrgMembers(string $orgId, string $userId): bool
    {
        return self::canDoInOrganization($orgId, $userId, Permissions::ORG_MEMBERS_VIEW);
    }

    public static function canManageOrgMembers(string $orgId, string $userId): bool
    {
        return self::canDoInOrganization($orgId, $userId, Permissions::ORG_MEMBERS_MANAGE);
    }

    public static function canInviteOrgMember(string $orgId, string $userId): bool
    {
        return self::canDoInOrganization($orgId, $userId, Permissions::ORG_MEMBER_INVITE);
    }

    public static function canManageOrgInvitation(string $orgId, string $userId): bool
    {
        return self::canDoInOrganization($orgId, $userId, Permissions::ORG_MEMBER_INVITE_MANAGE);
    }

    public static function buildOrgPermissionsForRole(string $role): array
    {
        $permissions = [
            Permissions::ORG_VIEW->value,
            Permissions::ORG_MEMBERS_VIEW->value,
        ];

        if (in_array($role, [RoleManager::ROLE_MEMBER, RoleManager::ROLE_ADMIN, RoleManager::ROLE_OWNER])) {
            $permissions = array_merge(
                $permissions,
                [
                    Permissions::WORKTIME_VIEW->value,
                    Permissions::WORKTIME_CREATE->value,
                ]
            );
        }

        if (in_array($role, [RoleManager::ROLE_ADMIN, RoleManager::ROLE_OWNER])) {
            $permissions = array_merge($permissions, [
                Permissions::ORG_UPDATE->value,
                Permissions::ORG_MEMBERS_MANAGE->value,
                Permissions::ORG_MEMBER_INVITE->value,
                Permissions::ORG_MEMBER_INVITE_MANAGE->value,
                Permissions::PROJECT_CREATE->value,
            ]);
        }

        if ($role === RoleManager::ROLE_OWNER) {
            $permissions[] = Permissions::ORG_DELETE->value;
        }

        return $permissions;
    }

    public static function orgCan(array $permissions, string $orgId, Permissions $permission): bool
    {
        return in_array($permission->value, $permissions['org'][$orgId] ?? []);
    }
}
