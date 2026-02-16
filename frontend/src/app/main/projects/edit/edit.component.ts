import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectFormComponent } from '../../../common/form/project-form/project-form.component';
import { Project } from '../../../shared/model/Project';
import { ProjectService } from '../../../shared/services/project/project.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-edit',
    imports: [MatIconModule, RouterLink, ProjectFormComponent, MatProgressSpinnerModule],
    templateUrl: './edit.component.html',
    styleUrl: './edit.component.css',
})
export class EditComponent {
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly projectService = inject(ProjectService);
    private readonly router = inject(Router);
    private readonly snackbar = inject(SnackbarService);
    projectId = signal<string>('');
    project = signal<Project | null>(null);

    constructor() {
        this.projectId.set(this.activeRoute.snapshot.parent?.paramMap.get('projectId') || '');

        if (!this.projectId()) {
            console.error('Project ID is missing in route parameters');
        }

        this.projectService.getProject(this.projectId()).subscribe({
            next: (project) => {
                this.project.set(project);
            },
            error: (err) => {
                console.error('Failed to load project:', err);
                this.router.navigate(['/projects']);
                this.snackbar.open('Failed to load project', ['snackbar-error']);
            },
        });
    }

    openInfo() {}
}
