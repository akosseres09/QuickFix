import {
    Component,
    inject,
    input,
    OnInit,
    Signal,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationExtras, Router, RouterLink } from '@angular/router';
import { ProjectFormComponent } from '../../../common/form/project-form/project-form.component';
import { Project } from '../../../shared/model/Project';
import { ProjectService } from '../../../shared/services/project/project.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { finalize } from 'rxjs';
import { applyValidationErrors } from '../../../shared/utils/formErrorHandler/formErrorHandler';

@Component({
    selector: 'app-edit',
    imports: [MatIconModule, RouterLink, ProjectFormComponent, MatProgressSpinnerModule],
    templateUrl: './edit-project.component.html',
    styleUrl: './edit-project.component.css',
})
export class EditProjectComponent implements OnInit {
    private readonly projectService = inject(ProjectService);
    private readonly router = inject(Router);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialogService = inject(DialogService);
    private readonly activeRoute = inject(ActivatedRoute);

    projectId = input.required<string>();
    organizationId = input.required<string>();
    project = signal<Project | null>(null);
    private readonly formComponent = viewChild(ProjectFormComponent);

    isSubmitting = signal<boolean>(false);

    infoDialogRef: Signal<TemplateRef<any> | undefined> = viewChild('infoDialog');
    routerOptions: NavigationExtras = {
        relativeTo: this.activeRoute,
    };

    ngOnInit() {
        const organizationId = this.organizationId();
        if (!organizationId) {
            console.error('Organization ID is missing in route parameters');
            this.snackbar.error('Organization ID is missing');
            this.router.navigate(['/organizations']);
            return;
        }

        const projectId = this.projectId();
        if (!projectId) {
            console.error('Project ID is missing in route parameters');
            this.snackbar.error('Project ID is missing');
            this.router.navigate(['../../../projects'], this.routerOptions);
            return;
        }

        this.projectService.getProject(organizationId, projectId).subscribe({
            next: (project) => {
                this.project.set(project);
            },
            error: (err) => {
                console.error('Failed to load project:', err);
                this.snackbar.error(err.error.message);
                this.router.navigate(['../../../projects'], this.routerOptions);
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

        const organizationId = this.organizationId();
        if (!organizationId) return;

        this.projectService
            .updateProject(organizationId, projectId, project)
            .pipe(finalize(() => this.isSubmitting.set(false)))
            .subscribe({
                next: (project) => {
                    this.router.navigate(['..'], this.routerOptions);
                },
                error: (error) => {
                    const form = this.formComponent();
                    if (form) {
                        applyValidationErrors(form.projectForm, error);
                    }
                    this.snackbar.error(error.error?.error?.message || 'Failed to update project');
                },
            });
    }
}
