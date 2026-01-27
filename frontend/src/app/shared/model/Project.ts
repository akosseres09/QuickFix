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

export interface Project extends BaseModel {
    id: string;
    name: string;
    key: string;
    description: string;
    status: string;
    startDate: Date;
    endDate: Date;
    owner_id: string;
    visibility: string;
    priority: number;
    color: string;
    progress: number;
    budget: number;
    createdAt: number;
    updatedAt: number;
    owner: User;
    projectMembers: Array<User>;
    members: Array<User>;
}
