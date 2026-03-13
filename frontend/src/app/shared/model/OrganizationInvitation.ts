import { Organization } from './Organization';
import { OrganizationMemberRole } from './OrganizationMember';
import { User } from './User';

export enum OrganizationInvitationStatus {
    Pending = 'pending',
    Accepted = 'accepted',
    Revoked = 'revoked',
    Rejected = 'rejected',
}

export interface OrganizationInvitation {
    id: string;
    organizationId: string;
    inviterId: string;
    email: string;
    role: OrganizationMemberRole;
    status: OrganizationInvitationStatus;
    token: string;
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
    inviter?: User;
    organization?: Organization;
}
