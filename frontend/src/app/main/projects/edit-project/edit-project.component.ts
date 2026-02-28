import { Component, inject, Signal, signal, TemplateRef, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectFormComponent } from '../../../common/form/project-form/project-form.component';
import { Project } from '../../../shared/model/Project';
import { ProjectService } from '../../../shared/services/project/project.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-edit',
    imports: [MatIconModule, RouterLink, ProjectFormComponent, MatProgressSpinnerModule],
    templateUrl: './edit-project.component.html',
    styleUrl: './edit-project.component.css',
})
export class EditProjectComponent {
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly projectService = inject(ProjectService);
    private readonly router = inject(Router);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialogService = inject(DialogService);

    projectId = signal<string>('');
    project = signal<Project | null>(null);

    isSubmitting = signal<boolean>(false);

    infoDialogRef: Signal<TemplateRef<any> | undefined> = viewChild('infoDialog');

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
                this.snackbar.error('Failed to load project!');
                this.router.navigate(['/projects']);
            },
        });
    }

    openInfo(): void {
        const dialogRef = this.infoDialogRef();
        if (!dialogRef) return;
        this.dialogService.openConfirmDialog('Project Information', dialogRef, {
            width: '600px',
        });
    }

    onProjectEdited(project: Partial<Project>) {
        const projectId = this.projectId();

        if (!projectId) return;

        this.projectService
            .updateProject(projectId, project)
            .pipe(finalize(() => this.isSubmitting.set(false)))
            .subscribe({
                next: (project) => {
                    this.router.navigate(['/project', project.key]);
                },
                error: (error) => {
                    console.error('Error updating project:', error);
                    this.snackbar.error('Failed to update project');
                },
            });
    }
}
