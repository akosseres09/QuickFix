import { BaseModel } from './BaseModel';
import { Project } from './Project';
import { User } from './User';

export const STATUS_OPEN = 0;
export const STATUS_IN_PROGRESS = 1;
export const STATUS_REVIEW = 2;
export const STATUS_RESOLVED = 3;
export const STATUS_CLOSED = 4;

export const STATUS_LIST = [
    STATUS_OPEN,
    STATUS_IN_PROGRESS,
    STATUS_REVIEW,
    STATUS_RESOLVED,
    STATUS_CLOSED,
];

export const STATUS_MAP: { [key: number]: string } = {
    [STATUS_OPEN]: 'Open',
    [STATUS_IN_PROGRESS]: 'In Progress',
    [STATUS_REVIEW]: 'Review',
    [STATUS_RESOLVED]: 'Resolved',
    [STATUS_CLOSED]: 'Closed',
};

export const PRIORITY_LOW = 0;
export const PRIORITY_MEDIUM = 1;
export const PRIORITY_HIGH = 2;
export const PRIORITY_CRITICAL = 3;
export const PRIORITIES = [PRIORITY_LOW, PRIORITY_MEDIUM, PRIORITY_HIGH, PRIORITY_CRITICAL];
export const PRIORITY_MAP: { [key: number]: string } = {
    [PRIORITY_LOW]: 'Low',
    [PRIORITY_MEDIUM]: 'Medium',
    [PRIORITY_HIGH]: 'High',
    [PRIORITY_CRITICAL]: 'Critical',
};

export const TYPE_BUG = 0;
export const TYPE_FEATURE = 1;
export const TYPE_TASK = 2;
export const TYPE_INCIDENT = 3;
export const TYPES = [TYPE_BUG, TYPE_FEATURE, TYPE_TASK, TYPE_INCIDENT];
export const TYPE_MAP: { [key: number]: string } = {
    [TYPE_BUG]: 'Bug',
    [TYPE_FEATURE]: 'Feature',
    [TYPE_TASK]: 'Task',
    [TYPE_INCIDENT]: 'Incident',
};

export interface Issue extends BaseModel {
    id: number;
    projectId: string;
    issueKey: string;
    title: string;
    description: string;
    type: typeof TYPE_BUG | typeof TYPE_FEATURE | typeof TYPE_TASK | typeof TYPE_INCIDENT;
    status:
        | typeof STATUS_OPEN
        | typeof STATUS_IN_PROGRESS
        | typeof STATUS_REVIEW
        | typeof STATUS_RESOLVED
        | typeof STATUS_CLOSED;
    priority:
        | typeof PRIORITY_LOW
        | typeof PRIORITY_MEDIUM
        | typeof PRIORITY_HIGH
        | typeof PRIORITY_CRITICAL;
    createdBy: string;
    assignedTo: string | null;
    createdAt: number;
    updatedAt: number | null;
    closedAt: number | null;
    dueDate: number | null;
    isArchived: boolean;
    creator?: User;
    assignee?: User | null;
    project?: Project;
}
