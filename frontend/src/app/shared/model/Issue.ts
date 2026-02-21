import { BaseModel } from './BaseModel';
import { Project } from './Project';
import { User } from './User';

export enum IssueStatus {
    OPEN = 0,
    IN_PROGRESS = 1,
    REVIEW = 2,
    RESOLVED = 3,
    CLOSED = 4,
}

export const STATUS_LIST = [
    IssueStatus.OPEN,
    IssueStatus.IN_PROGRESS,
    IssueStatus.REVIEW,
    IssueStatus.RESOLVED,
    IssueStatus.CLOSED,
];

export const STATUS_MAP: { [key: number]: string } = {
    [IssueStatus.OPEN]: 'Open',
    [IssueStatus.IN_PROGRESS]: 'In Progress',
    [IssueStatus.REVIEW]: 'Review',
    [IssueStatus.RESOLVED]: 'Resolved',
    [IssueStatus.CLOSED]: 'Closed',
};

export const STATUS_COLOR_MAP: { [key: number]: string } = {
    [IssueStatus.OPEN]: 'text-sky-700 bg-sky-50',
    [IssueStatus.IN_PROGRESS]: 'text-indigo-700 bg-indigo-100',
    [IssueStatus.REVIEW]: 'text-fuchsia-700 bg-fuchsia-100',
    [IssueStatus.RESOLVED]: 'text-teal-700 bg-teal-100',
    [IssueStatus.CLOSED]: 'text-gray-500 bg-gray-200',
};

export enum IssuePriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3,
}

export const PRIORITIES = [
    IssuePriority.LOW,
    IssuePriority.MEDIUM,
    IssuePriority.HIGH,
    IssuePriority.CRITICAL,
];

export const PRIORITY_MAP: { [key: number]: string } = {
    [IssuePriority.LOW]: 'Low',
    [IssuePriority.MEDIUM]: 'Medium',
    [IssuePriority.HIGH]: 'High',
    [IssuePriority.CRITICAL]: 'Critical',
};

export const PRIORITY_COLOR_MAP: { [key: number]: string } = {
    [IssuePriority.LOW]: 'text-green-900 bg-green-200',
    [IssuePriority.MEDIUM]: 'text-yellow-900 bg-yellow-200',
    [IssuePriority.HIGH]: 'text-orange-900 bg-orange-200',
    [IssuePriority.CRITICAL]: 'text-red-900 bg-red-200',
};

export enum IssueType {
    TASK = 0,
    FEATURE = 1,
    INCIDENT = 2,
    BUG = 3,
}

export const TYPES = [IssueType.BUG, IssueType.FEATURE, IssueType.TASK, IssueType.INCIDENT];

export const TYPE_MAP: { [key: number]: string } = {
    [IssueType.BUG]: 'Bug',
    [IssueType.FEATURE]: 'Feature',
    [IssueType.TASK]: 'Task',
    [IssueType.INCIDENT]: 'Incident',
};

export const TYPE_COLOR_MAP: { [key: number]: string } = {
    [IssueType.BUG]: 'text-red-700 bg-red-100',
    [IssueType.FEATURE]: 'text-purple-700 bg-purple-100',
    [IssueType.TASK]: 'text-blue-700 bg-blue-100',
    [IssueType.INCIDENT]: 'text-orange-700 bg-orange-100',
};

export interface Issue extends BaseModel {
    id: string;
    projectId: string;
    issueKey: string;
    title: string;
    description: string;
    type: IssueType;
    status: IssueStatus;
    priority: IssuePriority;
    createdBy: string;
    updatedBy: string | null;
    assignedTo: string | null;
    createdAt: number;
    updatedAt: number | null;
    closedAt: number | null;
    dueDate: number | null;
    isArchived: boolean;
    creator?: User;
    assignee?: User | null;
    project?: Project;
    updator?: User | null;
}
