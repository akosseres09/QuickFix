import { BaseModel } from './BaseModel';
import { User } from './User';

export const TO_DO = 'to_do';
export const OPEN = 'open';
export const IN_PROGRESS = 'in_progress';
export const CLOSED = 'closed';

export interface Issue extends BaseModel {
    id: number;
    title: string;
    description: string;
    status: typeof TO_DO | typeof IN_PROGRESS | typeof CLOSED | typeof OPEN;
    createdAt: Date;
    updatedAt?: Date;
    author: User;
    assignee?: User | null;
    project: string;
}
