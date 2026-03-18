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
    public static function getBasePermissions(UserRole $userRole)
    {
        $permissions = [
            'base' => [],
            'org' => []
        ];
        $permissions['base'] = match ($userRole) {
            UserRole::ADMIN => [
                Permissions::ORG_VIEW->value,
                Permissions::ORG_UPDATE->value,
                Permissions::ORG_DELETE->value,
                Permissions::ORG_CREATE->value,
                Permissions::USER_VIEW->value,
                Permissions::USER_UPDATE->value,
                Permissions::USER_DELETE->value,
            ],
            UserRole::USER => [],
        };

        if ($userRole === UserRole::USER) {
            $memberships = OrganizationMember::find()
                ->select(['organization_id', 'role'])
                ->byUserId(Yii::$app->user->id)
                ->asArray()
                ->all();

            foreach ($memberships as $membership) {
                if ($membership['role'] === 'owner' || $membership['role'] === 'admin') {
                    $permissions = array_merge($permissions, self::getOrganizationPermissions(
                        $membership['organization_id'],
                        Yii::$app->user->id,
                        $membership['role']
                    ));
                }
            }
        }

        return $permissions;
    }

    public static function getOrganizationPermissions(string $orgId, string $userId, ?string $role = null): array
    {
        $org = Organization::find()->byId($orgId)->one();
        if (!$org) {
            return [];
        }

        if (!$role) {
            $role = OrganizationMember::find()
                ->select('role')
                ->where(['organization_id' => $org->id, 'user_id' => $userId])
                ->scalar();
        }


        if (!$role) return [];

        $permissions = [
            Permissions::ORG_VIEW->value,
            Permissions::ORG_MEMBERS_VIEW->value
        ];

        if (in_array($role, [
            OrganizationMember::ROLE_ADMIN,
            OrganizationMember::ROLE_OWNER
        ])) {
            $permissions = array_merge($permissions, [
                Permissions::ORG_UPDATE->value,
                Permissions::ORG_MEMBERS_MANAGE->value,
                Permissions::ORG_MEMBER_INVITE->value,
                Permissions::PROJECT_CREATE->value
            ]);
        }

        if ($role === OrganizationMember::ROLE_OWNER) {
            $permissions = array_merge($permissions, [
                Permissions::ORG_DELETE->value
            ]);
        }

        return [
            'org' => [
                $orgId => $permissions,
                $org->slug => $permissions
            ]
        ];
    }


    public static function getProjectPermissions(string $projectId, string $userId): array
    {
        $project = Project::find()->byId($projectId)->one();

        if (!$project) {
            return [];
        }

        $role = self::getEffectiveProjectRole($project, $userId);

        if (!$role) return [];

        // Base permissions
        $permissions = ['project.view', 'project.members.view', 'issue.view', 'comment.view'];

        // Members, Admins, Owners
        if (in_array($role, [
            ProjectMember::ROLE_MEMBER,
            ProjectMember::ROLE_ADMIN,
            ProjectMember::ROLE_OWNER
        ])) {
            $permissions = array_merge($permissions, [
                'issue.create',
                'issue.update',
                'issue.transition',
                'comment.create'
            ]);
        }

        // Admins, Owners
        if (in_array($role, [
            ProjectMember::ROLE_ADMIN,
            ProjectMember::ROLE_OWNER
        ])) {
            $permissions = array_merge($permissions, [
                'project.update',
                'project.members.manage',
                'issue.delete',
                'comment.delete.any'
            ]);
        }

        if ($role === ProjectMember::ROLE_OWNER) {
            $permissions[] = 'project.delete';
        }

        return $permissions;
    }

    public static function canUpdateIssue(Issue $issue, string $userId): bool
    {
        $projectPermissions = self::getProjectPermissions($issue->project_id, $userId);
        return in_array('issue.update', $projectPermissions);
    }

    public static function canDeleteComment(Comment $comment, string $userId): bool
    {
        $projectPermissions = self::getProjectPermissions($comment->issue->project_id, $userId);

        // Admins can delete ANY comment
        if (in_array('comment.delete.any', $projectPermissions)) {
            return true;
        }

        // Regular users can only delete their OWN comments
        return $comment->user_id === $userId;
    }


    /**
     * Calculates the highest effective role a user has in a specific project.
     * @param Project $project The project model
     * @param string $userId The user ID
     * @return string|null Returns the role string, or null if the user has no access
     */
    private static function getEffectiveProjectRole(Project $project, string $userId): ?string
    {
        // explicit role in the project (if user has one)
        $projectMember = ProjectMember::find()
            ->select('role')
            ->where(['project_id' => $project->id, 'user_id' => $userId])
            ->scalar();

        // overall role in the organization
        $orgMember = OrganizationMember::find()
            ->select('role')
            ->where(['organization_id' => $project->organization_id, 'user_id' => $userId])
            ->scalar();

        // if user isn't even in the organization, deny access entirely
        if (!$orgMember) {
            return null;
        }

        $projectWeight = RoleManager::getWeight($projectMember);
        $orgWeight = RoleManager::getWeight($orgMember);

        // If user is an admin or owner in the organization, they automatically get that power here.
        if ($orgWeight >= RoleManager::getWeight(RoleManager::ROLE_ADMIN)) {
            return $orgWeight > $projectWeight ? $orgMember : $projectMember;
        }

        if ($project->visibility === 'public') {
            // For public projects, regular Org members act as Project Members 
            // unless they were explicitly given a higher project role.
            $baseWeight = RoleManager::getWeight(RoleManager::ROLE_MEMBER);
            return $projectWeight > $baseWeight ? $projectMember : RoleManager::ROLE_MEMBER;
        }

        // If project is private and user isn't an org admin, they must have an explicit project role.
        return $projectMember ?: null;
    }
}
