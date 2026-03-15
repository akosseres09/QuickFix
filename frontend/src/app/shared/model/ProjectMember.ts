import { Project } from './Project';
import { User } from './User';

export enum ProjectMemberRoles {
    GUEST = 'guest',
    MEMBER = 'member',
    ADMIN = 'admin',
    OWNER = 'owner',
}

export const ROLES = [
    ProjectMemberRoles.GUEST,
    ProjectMemberRoles.MEMBER,
    ProjectMemberRoles.ADMIN,
    ProjectMemberRoles.OWNER,
];

export const ROLE_LABELS: Record<ProjectMemberRoles, string> = {
    [ProjectMemberRoles.GUEST]: 'Guest',
    [ProjectMemberRoles.MEMBER]: 'Member',
    [ProjectMemberRoles.ADMIN]: 'Admin',
    [ProjectMemberRoles.OWNER]: 'Owner',
};

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectMemberRoles;
    createdAt: number;
    project?: Project;
    user?: User;
}
