import {
    Component,
    DestroyRef,
    inject,
    Signal,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectFormComponent } from '../../../common/form/project-form/project-form.component';
import { Project } from '../../../shared/model/Project';
import { ProjectService } from '../../../shared/services/project/project.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    private readonly destroyRef = inject(DestroyRef);

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
                this.router.navigate(['/projects']);
                this.snackbar.open('Failed to load project', ['snackbar-error']);
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
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (project) => {
                    this.router.navigate(['/project', project.key]);
                    this.isSubmitting.set(false);
                },
                error: (error) => {
                    console.error('Error creating project:', error);
                    this.isSubmitting.set(false);
                },
            });
    }
}
