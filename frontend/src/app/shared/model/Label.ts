import { Project } from './Project';

export interface Label {
    id: string;
    name: string;
    color: string;
    projectId: string;
    project?: Project;
}
