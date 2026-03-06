import { Issue } from './Issue';
import { User } from './User';

export interface IssueComment {
    id: string;
    issueId: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    updatedBy: string;
    issue?: Issue;
    creator?: User;
    updator?: User;
}
