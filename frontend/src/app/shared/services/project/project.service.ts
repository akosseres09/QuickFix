import { Injectable } from '@angular/core';
import { Project } from '../../model/Project';
import { UserService } from '../user/user.service';
import { User } from '../../model/User';

export interface ProjectFilters {
    projectName?: string | null;
}

@Injectable({
    providedIn: 'root',
})
export class ProjectService {
    constructor(private userService: UserService) {}

    getProjects(filters: Partial<ProjectFilters> = {}): Array<Project> {
        let baseProjects = [
            {
                id: '1',
                name: 'Google IT',
                createdAt: new Date(),
                admin: this.userService.getUser() as User,
                users: [],
                issues: [],
            },
            {
                id: '1',
                name: 'Google HR',
                createdAt: new Date(),
                admin: this.userService.getUser() as User,
                users: [
                    this.userService.getUser() as User,
                    this.userService.getUser() as User,
                    this.userService.getUser() as User,
                    this.userService.getUser() as User,
                ],
                issues: [],
            },
        ];

        baseProjects = baseProjects.filter((project) => {
            if (filters.projectName) {
                return project.name.toLowerCase().includes(filters.projectName.toLowerCase());
            }
            return true;
        });

        return baseProjects;
    }
}
