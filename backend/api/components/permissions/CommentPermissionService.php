<?php

namespace api\components\permissions;

use common\models\Comment;

class CommentPermissionService
{
    public static function canViewComment(Comment $comment, string $userId): bool
    {
        $projectId = $comment->issue->project_id;
        $permissions = ProjectPermissionService::getProjectPermissions($projectId, $userId);
        return ProjectPermissionService::projectCan($permissions, $projectId, Permissions::ISSUE_VIEW);
    }

    public static function canCreateComment(string $projectId, string $userId): bool
    {
        $permissions = ProjectPermissionService::getProjectPermissions($projectId, $userId);
        return ProjectPermissionService::projectCan($permissions, $projectId, Permissions::COMMENT_CREATE);
    }

    public static function canDeleteComment(Comment $comment, string $userId): bool
    {
        $projectId   = $comment->issue->project_id;
        $permissions = ProjectPermissionService::getProjectPermissions($projectId, $userId);

        return ProjectPermissionService::projectCan($permissions, $projectId, Permissions::COMMENT_DELETE_ANY)
            || $comment->created_by === $userId;
    }

    public static function canUpdateComment(Comment $comment, string $userId): bool
    {
        $projectId   = $comment->issue->project_id;
        $permissions = ProjectPermissionService::getProjectPermissions($projectId, $userId);

        return ProjectPermissionService::projectCan($permissions, $projectId, Permissions::COMMENT_UPDATE_ANY)
            || $comment->created_by === $userId;
    }
}
