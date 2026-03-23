<?php

namespace api\components\permissions;

use common\models\Comment;
use common\models\Issue;
use common\models\Organization;
use common\models\OrganizationMember;
use common\models\Project;
use common\models\ProjectMember;
use common\models\UserRole;
use Yii;

class PermissionService
{
    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

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

        // For regular users, eagerly load permissions for orgs where they
        // are an admin or owner, so the frontend has them without a context fetch.
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

    public static function getProjectPermissions(string $projectId, string $userId): array
    {
        $project = Project::find()->byId($projectId)->one();
        if (!$project) return [];

        $orgRole = OrganizationMember::find()
            ->select('role')
            ->where(['organization_id' => $project->organization_id, 'user_id' => $userId])
            ->scalar();

        // Not a member of the org at all — deny immediately
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

    /**
     * Returns permissions for every project a user can access in an org.
     * Used when loading the project list page.
     */
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

    // -------------------------------------------------------------------------
    // Resource-level authorization helpers
    // -------------------------------------------------------------------------

    public static function canUpdateIssue(Issue $issue, string $userId): bool
    {
        $permissions = self::getProjectPermissions($issue->project_id, $userId);
        return self::projectCan($permissions, $issue->project_id, Permissions::ISSUE_UPDATE);
    }

    public static function canDeleteComment(Comment $comment, string $userId): bool
    {
        $projectId   = $comment->issue->project_id;
        $permissions = self::getProjectPermissions($projectId, $userId);

        return self::projectCan($permissions, $projectId, Permissions::COMMENT_DELETE_ANY)
            || $comment->user_id === $userId;
    }

    public static function canUpdateComment(Comment $comment, string $userId): bool
    {
        $projectId   = $comment->issue->project_id;
        $permissions = self::getProjectPermissions($projectId, $userId);

        return self::projectCan($permissions, $projectId, Permissions::COMMENT_UPDATE_ANY)
            || $comment->user_id === $userId;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Resolves the highest effective role a user has in a project,
     * taking into account their org-level role and the project's visibility.
     */
    private static function resolveRole(
        string  $orgRole,
        ?string $projectRole,
        string  $visibility
    ): ?string {
        $orgWeight     = RoleManager::getWeight($orgRole);
        $projectWeight = RoleManager::getWeight($projectRole);
        $isElevated    = $orgWeight >= RoleManager::getWeight(RoleManager::ROLE_ADMIN);

        if ($isElevated) {
            // If no project role exists, fall back to org role
            if (!$projectRole) return $orgRole;
            return $projectWeight > $orgWeight ? $projectRole : $orgRole;
        }

        if ($visibility === Project::VISIBILITY_PUBLIC) {
            $memberWeight = RoleManager::getWeight(RoleManager::ROLE_MEMBER);
            return $projectWeight > $memberWeight ? $projectRole : RoleManager::ROLE_MEMBER;
        }

        return $projectRole ?: null;
    }

    private static function buildOrgPermissionsForRole(string $role): array
    {
        $permissions = [
            Permissions::ORG_VIEW->value,
            Permissions::ORG_MEMBERS_VIEW->value,
        ];

        if (in_array($role, [OrganizationMember::ROLE_MEMBER, OrganizationMember::ROLE_ADMIN, OrganizationMember::ROLE_OWNER])) {
            $permissions = array_merge(
                $permissions,
                [
                    Permissions::WORKTIME_VIEW->value,
                    Permissions::WORKTIME_CREATE->value,
                ]
            );
        }

        if (in_array($role, [OrganizationMember::ROLE_ADMIN, OrganizationMember::ROLE_OWNER])) {
            $permissions = array_merge($permissions, [
                Permissions::ORG_UPDATE->value,
                Permissions::ORG_MEMBERS_MANAGE->value,
                Permissions::ORG_MEMBER_INVITE->value,
                Permissions::PROJECT_CREATE->value,
            ]);
        }

        if ($role === OrganizationMember::ROLE_OWNER) {
            $permissions[] = Permissions::ORG_DELETE->value;
        }

        return $permissions;
    }

    private static function buildProjectPermissionsForRole(string $role): array
    {
        // Viewer-level (all org members who can see the project)
        $permissions = [
            Permissions::PROJECT_VIEW->value,
            Permissions::PROJECT_MEMBERS_VIEW->value,
            Permissions::ISSUE_VIEW->value,
            Permissions::WORKTIME_VIEW->value,
        ];

        // Contributor-level
        if (in_array($role, [ProjectMember::ROLE_MEMBER, ProjectMember::ROLE_ADMIN, ProjectMember::ROLE_OWNER])) {
            $permissions = array_merge($permissions, [
                Permissions::ISSUE_CREATE->value,
                Permissions::ISSUE_UPDATE->value,
                Permissions::COMMENT_CREATE->value,
                Permissions::COMMENT_UPDATE->value,
                Permissions::WORKTIME_CREATE->value,
            ]);
        }

        // Moderator-level
        if (in_array($role, [ProjectMember::ROLE_ADMIN, ProjectMember::ROLE_OWNER])) {
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

        // Owner-only
        if ($role === ProjectMember::ROLE_OWNER) {
            $permissions[] = Permissions::PROJECT_DELETE->value;
        }

        return $permissions;
    }

    /**
     * Returns a map of [project_id => role] for all projects the user
     * has an explicit ProjectMember record in, within the given org.
     */
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

    /**
     * Returns all projects visible to a user in an org.
     * Elevated users (admin/owner) see everything; others see public + explicit.
     */
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

    /**
     * Checks a permission against the structured project permissions array.
     */
    private static function projectCan(array $permissions, string $projectId, Permissions $permission): bool
    {
        return in_array($permission->value, $permissions['project'][$projectId] ?? []);
    }
}
