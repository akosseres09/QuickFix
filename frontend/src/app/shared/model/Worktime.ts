import { BaseModel } from './BaseModel';

export interface WorktimeEntry extends BaseModel {
    id: string;
    issue: string;
    issueId: number;
    date: string;
    hours: number;
    description: string;
    user: string;
}
