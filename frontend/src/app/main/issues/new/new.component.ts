import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IssueFormComponent } from '../../../common/form/issue-form/issue-form.component';
import { Issue } from '../../../shared/model/Issue';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-new',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        IssueFormComponent,
    ],
    templateUrl: './new.component.html',
    styleUrl: './new.component.css',
})
export class NewComponent {
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly issueService = inject(IssueService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);

    isSubmitting = signal<boolean>(false);

    projectId = signal<string>(this.activeRoute.snapshot.parent?.parent?.params['projectId'] || '');

    constructor() {
        this.issueService.setProjectId(this.projectId());
    }

    /**
     * Handles issue creation when the form is submitted.
     * @param issue the data emitted from the issue form, containing the new issue details.
     */
    onIssueCreated(issue: Partial<Issue>): void {
        this.issueService
            .createIssue(issue)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (issue) => {
                    this.snackbarService.open(`Issue "${issue.title}" created successfully!`);
                    this.router.navigate(['/project', this.projectId(), 'issues']);
                },
                error: (error) => {
                    this.isSubmitting.set(false);
                    this.snackbarService.open(
                        error?.error?.message || 'Failed to create issue. Please try again.',
                        ['snackbar-error']
                    );
                },
            });
    }
}
