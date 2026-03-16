import { Project } from './Project';

export enum FixStatusNames {
    OPEN = 'Open',
    CLOSED = 'Closed',
}

export interface Label {
    id: string;
    name: string;
    description: string;
    color: string;
    projectId: string;
    project?: Project;
}
