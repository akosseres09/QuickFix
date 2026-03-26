import { MemberRole } from '../constants/Role';
import { Project } from './Project';
import { User } from './User';

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: MemberRole;
    createdAt: number;
    project?: Project;
    user?: User;
}
