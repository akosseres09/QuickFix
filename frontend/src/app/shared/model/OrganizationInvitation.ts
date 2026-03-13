import { BaseModel } from './BaseModel';
import { Organization } from './Organization';
import { OrganizationMemberRole } from './OrganizationMember';
import { User } from './User';

export enum OrganizationInvitationStatus {
    Pending = 'pending',
    Accepted = 'accepted',
    Revoked = 'revoked',
    Rejected = 'rejected',
}

export const ORGANIZATION_INVITATION_STATUS_MAP: { [key: string]: string } = {
    [OrganizationInvitationStatus.Pending]: 'Pending',
    [OrganizationInvitationStatus.Accepted]: 'Accepted',
    [OrganizationInvitationStatus.Revoked]: 'Revoked',
    [OrganizationInvitationStatus.Rejected]: 'Rejected',
};

export const ORGANIZATION_INVITATION_STATUS_COLOR_MAP: { [key: string]: string } = {
    [OrganizationInvitationStatus.Pending]:
        'text-yellow-700 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700',
    [OrganizationInvitationStatus.Accepted]:
        'text-green-700 border-green-300 dark:text-green-400 dark:border-green-700',
    [OrganizationInvitationStatus.Revoked]:
        'text-gray-700 border-gray-300 dark:text-gray-300 dark:border-gray-600',
    [OrganizationInvitationStatus.Rejected]:
        'text-red-700 border-red-300 dark:text-red-400 dark:border-red-700',
};

export interface OrganizationInvitation extends BaseModel {
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
