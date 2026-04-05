<?php

namespace api\components\permissions;

use common\models\OrganizationMember;
use common\models\Project;
use common\models\ProjectMember;

class ProjectPermissionService
{
    public static function getProjectPermissions(string $projectId, string $userId): array
    {
        $project = Project::find()->byId($projectId)->one();
        if (!$project) return [];

        $orgRole = OrganizationMember::find()
            ->select('role')
            ->where(['organization_id' => $project->organization_id, 'user_id' => $userId])
            ->scalar();

        if (!$orgRole) return [];

        $projectRole = ProjectMember::find()
            ->select('role')
            ->where(['project_id' => $project->id, 'user_id' => $userId])
            ->scalar();

        $effectiveRole = self::resolveRole(
            $orgRole,
            $projectRole,
            $project->visibility
        );

        $builtPermissions = $effectiveRole ? self::buildProjectPermissionsForRole($effectiveRole) : [];

        return $effectiveRole
            ? ['project' => [
                $projectId => $builtPermissions,
                $project->key => $builtPermissions
            ]]
            : [];
    }

    public static function getAllProjectPermissions(string $orgId, string $userId): array
    {
        $orgRole = OrganizationMember::find()
            ->select('role')
            ->where(['organization_id' => $orgId, 'user_id' => $userId])
            ->scalar();

        if (!$orgRole) return [];

        $isElevated = RoleManager::getWeight($orgRole) >= RoleManager::getWeight(RoleManager::ROLE_ADMIN);

        $membershipMap = self::fetchProjectMembershipMap($orgId, $userId);
        $projects      = self::fetchAccessibleProjects($orgId, $isElevated, array_keys($membershipMap));

        $result = [];
        foreach ($projects as $project) {
            $effectiveRole = self::resolveRole(
                $orgRole,
                $membershipMap[$project['id']] ?? null,
                $project['visibility']
            );

            if ($effectiveRole) {
                $permissions = self::buildProjectPermissionsForRole($effectiveRole);
                $result[$project['id']] = $permissions;
                $result[$project['key']] = $permissions;
            }
        }

        return ['project' => $result];
    }

    public static function canDoInProject(string $projectId, string $userId, Permissions $permission): bool
    {
        $permissions = self::getProjectPermissions($projectId, $userId);
        return self::projectCan($permissions, $projectId, $permission);
    }

    public static function canCreateProject(string $orgId, string $userId): bool
    {
        return OrganizationPermissionService::canDoInOrganization($orgId, $userId, Permissions::PROJECT_CREATE);
    }

    public static function canViewProject(Project $project, string $userId): bool
    {
        $permissions = self::getProjectPermissions($project->id, $userId);
        return self::projectCan($permissions, $project->id, Permissions::PROJECT_VIEW);
    }

    public static function canUpdateProject(Project $project, string $userId): bool
    {
        $permissions = self::getProjectPermissions($project->id, $userId);
        return self::projectCan($permissions, $project->id, Permissions::PROJECT_UPDATE);
    }

    public static function canDeleteProject(Project $project, string $userId): bool
    {
        $permissions = self::getProjectPermissions($project->id, $userId);
        return self::projectCan($permissions, $project->id, Permissions::PROJECT_DELETE);
    }

    public static function canViewProjectMembers(string $projectId, string $userId): bool
    {
        return self::canDoInProject($projectId, $userId, Permissions::PROJECT_MEMBERS_VIEW);
    }

    public static function canManageProjectMembers(string $projectId, string $userId): bool
    {
        return self::canDoInProject($projectId, $userId, Permissions::PROJECT_MEMBERS_MANAGE);
    }

    public static function resolveRole(
        string  $orgRole,
        ?string $projectRole,
        string  $visibility
    ): ?string {
        $orgWeight     = RoleManager::getWeight($orgRole);
        $projectWeight = RoleManager::getWeight($projectRole);
        $isElevated    = $orgWeight >= RoleManager::getWeight(RoleManager::ROLE_ADMIN);

        if ($isElevated) {
            if (!$projectRole) return $orgRole;
            return $projectWeight > $orgWeight ? $projectRole : $orgRole;
        }

        if ($visibility === Project::VISIBILITY_PUBLIC || $visibility === Project::VISIBILITY_TEAM) {
            $memberWeight = RoleManager::getWeight(RoleManager::ROLE_MEMBER);
            return $projectWeight > $memberWeight ? $projectRole : RoleManager::ROLE_MEMBER;
        }

        return $projectRole ?: null;
    }

    public static function buildProjectPermissionsForRole(string $role): array
    {
        $permissions = [
            Permissions::PROJECT_VIEW->value,
            Permissions::PROJECT_MEMBERS_VIEW->value,
            Permissions::ISSUE_VIEW->value,
            Permissions::WORKTIME_VIEW->value,
        ];

        if (in_array($role, [RoleManager::ROLE_MEMBER, RoleManager::ROLE_ADMIN, RoleManager::ROLE_OWNER])) {
            $permissions = array_merge($permissions, [
                Permissions::ISSUE_CREATE->value,
                Permissions::ISSUE_UPDATE->value,
                Permissions::COMMENT_CREATE->value,
                Permissions::COMMENT_UPDATE->value,
                Permissions::WORKTIME_CREATE->value,
            ]);
        }

        if (in_array($role, [RoleManager::ROLE_ADMIN, RoleManager::ROLE_OWNER])) {
            $permissions = array_merge($permissions, [
                Permissions::PROJECT_UPDATE->value,
                Permissions::PROJECT_MEMBERS_MANAGE->value,
                Permissions::PROJECT_MEMBER_INVITE->value,
                Permissions::ISSUE_DELETE->value,
                Permissions::COMMENT_DELETE_ANY->value,
                Permissions::COMMENT_UPDATE_ANY->value,
                Permissions::WORKTIME_VIEW_ANY->value,
                Permissions::WORKTIME_UPDATE_ANY->value,
                Permissions::WORKTIME_DELETE_ANY->value,
            ]);
        }

        if ($role === RoleManager::ROLE_OWNER) {
            $permissions[] = Permissions::PROJECT_DELETE->value;
        }

        return $permissions;
    }

    public static function projectCan(array $permissions, string $projectId, Permissions $permission): bool
    {
        return in_array($permission->value, $permissions['project'][$projectId] ?? []);
    }

    private static function fetchProjectMembershipMap(string $orgId, string $userId): array
    {
        $rows = ProjectMember::find()
            ->select(['project_id', 'role'])
            ->joinWith('project', false)
            ->where([
                'project.organization_id' => $orgId,
                'project_member.user_id'  => $userId,
            ])
            ->asArray()
            ->all();

        return array_column($rows, 'role', 'project_id');
    }

    private static function fetchAccessibleProjects(
        string $orgId,
        bool   $isElevated,
        array  $explicitProjectIds
    ): array {
        $query = Project::find()
            ->select(['id', 'visibility', 'key'])
            ->where(['organization_id' => $orgId]);

        if (!$isElevated) {
            $query->andWhere([
                'or',
                ['visibility' => Project::VISIBILITY_PUBLIC],
                ['id' => $explicitProjectIds],
            ]);
        }

        return $query->asArray()->all();
    }
}
