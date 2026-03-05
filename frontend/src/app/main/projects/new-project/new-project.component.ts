import { Component, inject, input, signal, Signal, TemplateRef, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { ProjectFormComponent } from '../../../common/form/project-form/project-form.component';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../shared/services/project/project.service';
import { Project } from '../../../shared/model/Project';
import { finalize } from 'rxjs';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-new',
    imports: [CommonModule, MatIconModule, RouterLink, ProjectFormComponent],
    templateUrl: './new-project.component.html',
    styleUrl: './new-project.component.css',
})
export class NewProjectComponent {
    private readonly dialogService = inject(DialogService);
    private readonly projectService = inject(ProjectService);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);

    organizationId = input.required<string>();
    infoDialogRef: Signal<TemplateRef<any> | undefined> = viewChild('infoDialog');
    isSubmitting = signal<boolean>(false);

    openInfo(): void {
        const dialogRef = this.infoDialogRef();
        if (!dialogRef) return;
        this.dialogService.openConfirmDialog('Project Information', dialogRef, {
            width: '600px',
        });
    }

    onProjectCreated(project: Partial<Project>) {
        const orgId = this.organizationId();
        if (!orgId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.isSubmitting.set(true);
        this.projectService
            .createProject(orgId, project)
            .pipe(finalize(() => this.isSubmitting.set(false)))
            .subscribe({
                next: (project) => {
                    this.router.navigate(['/', orgId, 'project', project.key]);
                },
                error: (error) => {
                    console.error('Error creating project:', error);
                    this.snackbarService.error('Failed to create project');
                },
            });
    }
}
