export enum MemberRole {
    GUEST = 'guest',
    MEMBER = 'member',
    ADMIN = 'admin',
    OWNER = 'owner',
}

export const ROLE_MAP: Record<string, string> = {
    [MemberRole.GUEST]: 'Guest',
    [MemberRole.MEMBER]: 'Member',
    [MemberRole.ADMIN]: 'Admin',
    [MemberRole.OWNER]: 'Owner',
};

export const ROLES = [MemberRole.GUEST, MemberRole.MEMBER, MemberRole.ADMIN, MemberRole.OWNER];
