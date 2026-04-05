<?php

namespace api\components\permissions;

use common\models\Issue;

class IssuePermissionService
{
    public static function canViewIssue(Issue $issue, string $userId): bool
    {
        $permissions = ProjectPermissionService::getProjectPermissions($issue->project_id, $userId);
        return ProjectPermissionService::projectCan($permissions, $issue->project_id, Permissions::ISSUE_VIEW);
    }

    public static function canCreateIssue(string $projectId, string $userId): bool
    {
        $permissions = ProjectPermissionService::getProjectPermissions($projectId, $userId);
        return ProjectPermissionService::projectCan($permissions, $projectId, Permissions::ISSUE_CREATE);
    }

    public static function canUpdateIssue(Issue $issue, string $userId): bool
    {
        $permissions = ProjectPermissionService::getProjectPermissions($issue->project_id, $userId);
        return ProjectPermissionService::projectCan($permissions, $issue->project_id, Permissions::ISSUE_UPDATE);
    }

    public static function canDeleteIssue(Issue $issue, string $userId): bool
    {
        $permissions = ProjectPermissionService::getProjectPermissions($issue->project_id, $userId);
        return ProjectPermissionService::projectCan($permissions, $issue->project_id, Permissions::ISSUE_DELETE);
    }
}
