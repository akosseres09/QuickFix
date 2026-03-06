import { Project } from './Project';
import { User } from './User';

export const ROLE_GUEST = 0;
export const ROLE_MEMBER = 1;
export const ROLE_ADMIN = 2;
export const ROLE_OWNER = 3;

export const ROLES = [ROLE_GUEST, ROLE_MEMBER, ROLE_ADMIN, ROLE_OWNER];

export const ROLE_LABELS: Record<
    typeof ROLE_GUEST | typeof ROLE_MEMBER | typeof ROLE_ADMIN | typeof ROLE_OWNER,
    string
> = {
    [ROLE_GUEST]: 'Guest',
    [ROLE_MEMBER]: 'Member',
    [ROLE_ADMIN]: 'Admin',
    [ROLE_OWNER]: 'Owner',
};

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: typeof ROLE_GUEST | typeof ROLE_MEMBER | typeof ROLE_ADMIN | typeof ROLE_OWNER;
    createdAt: number;
    project?: Project;
    user?: User;
}
