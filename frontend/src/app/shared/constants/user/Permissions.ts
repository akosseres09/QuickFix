export enum OrganizationPermissions {
    VIEW = 'organization.view',
    CREATE = 'organization.create',
    UPDATE = 'organization.update',
    DELETE = 'organization.delete',
    MEMBERS_VIEW = 'organization.member.view',
    MEMBERS_MANAGE = 'organization.member.manage',
    MEMBER_INVITE = 'organization.member.invite',
}

export type Permissions = {
    base: string[];
    org: {
        [orgId: string]: string[];
    };
};
