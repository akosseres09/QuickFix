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

export const TYPE_TASK = 0;
export const TYPE_FEATURE = 1;
export const TYPE_INCIDENT = 2;
export const TYPE_BUG = 3;
export const TYPES = [TYPE_BUG, TYPE_FEATURE, TYPE_TASK, TYPE_INCIDENT];
export const TYPE_MAP: { [key: number]: string } = {
    [TYPE_BUG]: 'Bug',
    [TYPE_FEATURE]: 'Feature',
    [TYPE_TASK]: 'Task',
    [TYPE_INCIDENT]: 'Incident',
};

export const TYPE_COLOR_MAP: { [key: number]: string } = {
    [TYPE_BUG]: 'text-red-700 bg-red-100',
    [TYPE_FEATURE]: 'text-purple-700 bg-purple-100',
    [TYPE_TASK]: 'text-blue-700 bg-blue-100',
    [TYPE_INCIDENT]: 'text-orange-700 bg-orange-100',
};

export const STATUS_COLOR_MAP: { [key: number]: string } = {
    [STATUS_OPEN]: 'text-sky-700 bg-sky-50',
    [STATUS_IN_PROGRESS]: 'text-indigo-700 bg-indigo-100',
    [STATUS_REVIEW]: 'text-fuchsia-700 bg-fuchsia-100',
    [STATUS_RESOLVED]: 'text-teal-700 bg-teal-100',
    [STATUS_CLOSED]: 'text-gray-500 bg-gray-200',
};

export const PRIORITY_COLOR_MAP: { [key: number]: string } = {
    [PRIORITY_LOW]: 'text-green-900 bg-green-200',
    [PRIORITY_MEDIUM]: 'text-yellow-900 bg-yellow-200',
    [PRIORITY_HIGH]: 'text-orange-900 bg-orange-200',
    [PRIORITY_CRITICAL]: 'text-red-900 bg-red-200',
};

export interface Issue extends BaseModel {
    id: string;
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
