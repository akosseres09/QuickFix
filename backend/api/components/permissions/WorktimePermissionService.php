<?php

namespace api\components\permissions;

use common\models\Worktime;

class WorktimePermissionService
{
    public static function canViewWorktime(string $orgId, string $userId): bool
    {
        return OrganizationPermissionService::canDoInOrganization($orgId, $userId, Permissions::WORKTIME_VIEW);
    }

    public static function canCreateWorktime(string $orgId, string $userId): bool
    {
        return OrganizationPermissionService::canDoInOrganization($orgId, $userId, Permissions::WORKTIME_CREATE);
    }

    public static function canUpdateWorktime(Worktime $worktime, string $userId): bool
    {
        if ($worktime->created_by === $userId) {
            return true;
        }
        $projectId = $worktime->issue->project_id;
        return ProjectPermissionService::canDoInProject($projectId, $userId, Permissions::WORKTIME_UPDATE_ANY);
    }

    public static function canDeleteWorktime(Worktime $worktime, string $userId): bool
    {
        if ($worktime->created_by === $userId) {
            return true;
        }
        $projectId = $worktime->issue->project_id;
        return ProjectPermissionService::canDoInProject($projectId, $userId, Permissions::WORKTIME_DELETE_ANY);
    }
}
