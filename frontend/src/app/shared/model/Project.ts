import { BaseModel } from './BaseModel';
import { Issue } from './Issue';
import { User } from './User';

export interface Project extends BaseModel {
    id: string;
    name: string;
    createdAt: Date;
    admin: User;
    users: Array<User>;
    issues: Array<Issue>;
}
