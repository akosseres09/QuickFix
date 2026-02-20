import {
    Component,
    DestroyRef,
    inject,
    signal,
    Signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { ProjectFormComponent } from '../../../common/form/project-form/project-form.component';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../shared/services/project/project.service';
import { Project } from '../../../shared/model/Project';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-new',
    imports: [CommonModule, MatIconModule, RouterLink, ProjectFormComponent],
    templateUrl: './new-project.component.html',
    styleUrl: './new-project.component.css',
})
export class NewProjectComponent {
    private readonly dialogService = inject(DialogService);
    private readonly projectService = inject(ProjectService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);

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
        this.projectService
            .createProject(project)
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
