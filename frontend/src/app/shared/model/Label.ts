import { Project } from './Project';

export enum FixStatusNames {
    OPEN = 'Open',
    CLOSED = 'Closed',
}

export const OPEN_STATUS: Label = {
    id: '',
    name: FixStatusNames.OPEN,
    description: 'Issue is open and ready for work.',
    color: '#14c93e',
    projectId: '',
};

export const CLOSED_STATUS: Label = {
    id: '',
    name: FixStatusNames.CLOSED,
    description: 'Issue is closed and no longer being worked on.',
    color: '#cf2a11',
    projectId: '',
};

export interface Label {
    id: string;
    name: string;
    description: string;
    color: string;
    projectId: string;
    project?: Project;
}
