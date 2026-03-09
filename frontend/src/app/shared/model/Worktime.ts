import { BaseModel } from './BaseModel';
import { Issue } from './Issue';
import { User } from './User';

export interface Worktime extends BaseModel {
    id: string;
    issueId: string;
    createdBy: string;
    updatedBy: string | null;
    minutesSpent: number;
    description: string;
    loggedAt: string; // 'YYYY-MM-DD' date string
    createdAt: number;
    updatedAt: number | null;
    issue?: Issue;
    creator?: User;
    updator?: User;
}
