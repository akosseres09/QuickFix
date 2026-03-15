import { BaseModel } from './BaseModel';
import { Organization } from './Organization';
import { User } from './User';

export enum OrganizationMemberRole {
    VIEWER = 'viewer',
    MEMBER = 'member',
    ADMIN = 'admin',
    OWNER = 'owner',
}

export const ORGANIZATION_MEMBER_ROLE_MAP: { [key: string]: string } = {
    [OrganizationMemberRole.VIEWER]: 'Viewer',
    [OrganizationMemberRole.MEMBER]: 'Member',
    [OrganizationMemberRole.ADMIN]: 'Admin',
    [OrganizationMemberRole.OWNER]: 'Owner',
};

export interface OrganizationMember extends BaseModel {
    id: string;
    organizationId: string;
    userId: string;
    role: OrganizationMemberRole;
    createdAt: number;
    organization?: Organization;
    user?: User;
}
