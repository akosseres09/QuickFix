export enum OrganizationPermissions {
    VIEW = 'organization.view',
    CREATE = 'organization.create',
    UPDATE = 'organization.update',
    DELETE = 'organization.delete',
    MEMBERS_VIEW = 'organization.member.view',
    MEMBERS_MANAGE = 'organization.member.manage',
    MEMBER_INVITE = 'organization.member.invite',
}

export enum ProjectPermissions {
    CREATE = 'project.create',
    VIEW = 'project.view',
    UPDATE = 'project.update',
    DELETE = 'project.delete',
    MEMBERS_VIEW = 'project.members.view',
    MEMBERS_MANAGE = 'project.members.manage',
    MEMBER_INVITE = 'project.member.invite',
}

export enum IssuePermissions {
    CREATE = 'issue.create',
    VIEW = 'issue.view',
    UPDATE = 'issue.update',
    DELETE = 'issue.delete',
}

export enum CommentPermissions {
    CREATE = 'comment.create',
    UPDATE = 'comment.update',
    DELETE_ANY = 'comment.delete.any',
}

export enum WorktimePermissions {
    VIEW = 'worktime.view',
    CREATE = 'worktime.create',
    VIEW_ANY = 'worktime.view.any',
    UPDATE_ANY = 'worktime.update.any',
    DELETE_ANY = 'worktime.delete.any',
}

export type Permissions = {
    base: string[];
    org: {
        [orgId: string]: string[];
    };
    project: {
        [projectId: string]: string[];
    };
};
