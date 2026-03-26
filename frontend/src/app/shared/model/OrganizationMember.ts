import { MemberRole } from '../constants/Role';
import { BaseModel } from './BaseModel';
import { Organization } from './Organization';
import { User } from './User';

export interface OrganizationMember extends BaseModel {
    id: string;
    organizationId: string;
    userId: string;
    role: MemberRole;
    createdAt: number;
    organization?: Organization;
    user?: User;
}
