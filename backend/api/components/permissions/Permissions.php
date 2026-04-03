<?php

namespace api\components\permissions;

enum Permissions: string
{
    case USER_VIEW = 'user.view';
    case USER_UPDATE = 'user.update';
    case USER_DELETE = 'user.delete';

        // --- ORGANIZATION PERMISSIONS ---
    case ORG_VIEW = 'organization.view';
    case ORG_CREATE = 'organization.create';
    case ORG_UPDATE = 'organization.update';
    case ORG_DELETE = 'organization.delete';
    case ORG_MEMBERS_VIEW = 'organization.member.view';
    case ORG_MEMBERS_MANAGE = 'organization.member.manage';
    case ORG_MEMBER_INVITE = 'organization.member.invite';
    case ORG_MEMBER_INVITE_MANAGE = 'organization.member.invite.manage';

        // --- PROJECT PERMISSIONS ---
    case PROJECT_CREATE = 'project.create';
    case PROJECT_VIEW = 'project.view';
    case PROJECT_UPDATE = 'project.update';
    case PROJECT_DELETE = 'project.delete';
    case PROJECT_MEMBERS_VIEW = 'project.members.view';
    case PROJECT_MEMBERS_MANAGE = 'project.members.manage';
    case PROJECT_MEMBER_INVITE = 'project.member.invite';

        // --- ISSUE PERMISSIONS ---
    case ISSUE_VIEW = 'issue.view';
    case ISSUE_CREATE = 'issue.create';
    case ISSUE_UPDATE = 'issue.update';
    case ISSUE_DELETE = 'issue.delete';

        // --- COMMENT PERMISSIONS ---
    case COMMENT_VIEW = 'comment.view';
    case COMMENT_CREATE = 'comment.create';
    case COMMENT_UPDATE = 'comment.update';
    case COMMENT_DELETE_ANY = 'comment.delete.any';
    case COMMENT_UPDATE_ANY = 'comment.update.any';

        // WORKTIME PERMISSIONS
    case WORKTIME_VIEW = 'worktime.view';
    case WORKTIME_CREATE = 'worktime.create';
    case WORKTIME_VIEW_ANY = 'worktime.view.any';
    case WORKTIME_UPDATE_ANY = 'worktime.update.any';
    case WORKTIME_DELETE_ANY = 'worktime.delete.any';
}
