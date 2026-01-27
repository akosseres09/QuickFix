import { BaseModel } from './BaseModel';
import { User } from './User';

export const STATUS_ACTIVE = 'active';
export const STATUS_ARCHIVED = 'archived';
export const STATUS_ON_HOLD = 'on_hold';
export const STATUS_COMPLETED = 'completed';

export const VISIBILITY_PUBLIC = 'public';
export const VISIBILITY_PRIVATE = 'private';
export const VISIBILITY_TEAM = 'team';

export const PRIORITY_LOW = 0;
export const PRIORITY_MEDIUM = 1;
export const PRIORITY_HIGH = 2;
export const PRIORITY_CRITICAL = 3;

export const PRIORITY_LIST = [PRIORITY_LOW, PRIORITY_MEDIUM, PRIORITY_HIGH, PRIORITY_CRITICAL];
export const VISIBILITY_LIST = [VISIBILITY_PUBLIC, VISIBILITY_PRIVATE, VISIBILITY_TEAM];
export const STATUS_LIST = [STATUS_ACTIVE, STATUS_ARCHIVED, STATUS_ON_HOLD, STATUS_COMPLETED];

export const PRIORITY_MAP: { [key: number]: string } = {
    [PRIORITY_LOW]: 'Low',
    [PRIORITY_MEDIUM]: 'Medium',
    [PRIORITY_HIGH]: 'High',
    [PRIORITY_CRITICAL]: 'Critical',
};

export const STATUS_MAP: { [key: string]: string } = {
    [STATUS_ACTIVE]: 'Active',
    [STATUS_ARCHIVED]: 'Archived',
    [STATUS_ON_HOLD]: 'On Hold',
    [STATUS_COMPLETED]: 'Completed',
};

export interface Project extends BaseModel {
    id: string;
    name: string;
    key: string;
    description: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    ownerId: string;
    visibility: string;
    priority: number;
    color: string;
    progress: number;
    budget: number;
    createdAt: number;
    updatedAt: number;
    owner?: User;
    projectMembers?: Array<User>;
    members?: Array<User>;
}
