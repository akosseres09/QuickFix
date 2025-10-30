import { Injectable } from '@angular/core';
import { Project } from '../../model/Project';

@Injectable({
    providedIn: 'root',
})
export class ProjectService {
    constructor() {}

    getProjects(): Array<Project> {
        return [];
    }
}
