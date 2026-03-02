import { BaseModel } from './BaseModel';
import { OrganizationMember } from './OrganizationMember';
import { Project } from './Project';
import { User } from './User';

export interface Organization extends BaseModel {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    ownerId: string;
    createdAt: number;
    updatedAt: number;
    deletedAt: number | null;
    owner?: User;
    projects?: Project[];
    organizationMembers?: OrganizationMember[];
}
