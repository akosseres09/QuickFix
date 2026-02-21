import { BaseModel } from './BaseModel';
import { User } from './User';

export enum ProjectStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
    ON_HOLD = 'on_hold',
    COMPLETED = 'completed',
}

export const STATUS_LIST = [
    ProjectStatus.ACTIVE,
    ProjectStatus.ARCHIVED,
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMPLETED,
];

export const STATUS_MAP: { [key: string]: string } = {
    [ProjectStatus.ACTIVE]: 'Active',
    [ProjectStatus.ARCHIVED]: 'Archived',
    [ProjectStatus.ON_HOLD]: 'On Hold',
    [ProjectStatus.COMPLETED]: 'Completed',
};

export const STATUS_COLOR_MAP: { [key: string]: string } = {
    [ProjectStatus.ACTIVE]: 'text-emerald-700 bg-emerald-100',
    [ProjectStatus.ARCHIVED]: 'text-slate-600 bg-slate-100',
    [ProjectStatus.ON_HOLD]: 'text-amber-700 bg-amber-100',
    [ProjectStatus.COMPLETED]: 'text-blue-700 bg-blue-100',
};

export enum ProjectVisibility {
    PUBLIC = 'public',
    PRIVATE = 'private',
    TEAM = 'team',
}

export const VISIBILITY_LIST = [
    ProjectVisibility.PUBLIC,
    ProjectVisibility.PRIVATE,
    ProjectVisibility.TEAM,
];

export const VISIBILITY_MAP: { [key: string]: string } = {
    [ProjectVisibility.PUBLIC]: 'Public',
    [ProjectVisibility.PRIVATE]: 'Private',
    [ProjectVisibility.TEAM]: 'Team',
};

export enum ProjectPriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3,
}

export const PRIORITY_LIST = [
    ProjectPriority.LOW,
    ProjectPriority.MEDIUM,
    ProjectPriority.HIGH,
    ProjectPriority.CRITICAL,
];

export const PRIORITY_MAP: { [key: number]: string } = {
    [ProjectPriority.LOW]: 'Low',
    [ProjectPriority.MEDIUM]: 'Medium',
    [ProjectPriority.HIGH]: 'High',
    [ProjectPriority.CRITICAL]: 'Critical',
};

export const PRIORITY_COLOR_MAP: { [key: number]: string } = {
    [ProjectPriority.LOW]: 'text-green-900 bg-green-200',
    [ProjectPriority.MEDIUM]: 'text-yellow-900 bg-yellow-200',
    [ProjectPriority.HIGH]: 'text-orange-900 bg-orange-200',
    [ProjectPriority.CRITICAL]: 'text-red-900 bg-red-200',
};

export interface Project extends BaseModel {
    id: string;
    name: string;
    key: string;
    description: string;
    status: ProjectStatus;
    startDate: string | null;
    endDate: string | null;
    ownerId: string;
    visibility: ProjectVisibility;
    priority: ProjectPriority;
    color: string;
    progress: number;
    budget: number;
    createdAt: number;
    updatedAt: number;
    owner?: User;
    projectMembers?: Array<User>;
    members?: Array<User>;
}
