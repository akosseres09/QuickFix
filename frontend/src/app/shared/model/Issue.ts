import { BaseModel } from './BaseModel';
import { Label } from './Label';
import { Project } from './Project';
import { User } from './User';

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
    statusLabel: string;
    priority: IssuePriority;
    createdBy: string;
    updatedBy: string | null;
    assignedTo: string | null;
    createdAt: number;
    updatedAt: number | null;
    closedAt: number | null;
    dueDate: number | null;
    isArchived: boolean;
    isDraft: boolean | null;
    creator?: User;
    assignee?: User | null;
    project?: Project;
    updator?: User | null;
    label?: Label;
}
