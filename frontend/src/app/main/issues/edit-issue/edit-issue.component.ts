import { Component, inject, signal } from '@angular/core';
import { IssueFormComponent } from '../../../common/form/issue-form/issue-form.component';
import { Issue } from '../../../shared/model/Issue';
import { ActivatedRoute, Router } from '@angular/router';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-edit',
    imports: [IssueFormComponent, MatProgressSpinnerModule],
    templateUrl: './edit-issue.component.html',
    styleUrl: './edit-issue.component.css',
})
export class EditIssueComponent {
    private readonly activateRoute = inject(ActivatedRoute);
    private readonly issueService = inject(IssueService);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);

    projectId = signal<string>(
        this.activateRoute.snapshot.parent?.parent?.paramMap.get('projectId') || ''
    );
    issueId = signal<string>(this.activateRoute.snapshot.paramMap.get('issueId') || '');
    issue = signal<Issue | null>(null);
    isSubmitting = signal<boolean>(false);

    constructor() {
        console.log(this.projectId());

        this.issueService.setProjectId(this.projectId());
        this.issueService.getIssueById(this.issueId()).subscribe({
            next: (issue) => {
                this.issue.set(issue);
            },
            error: (err) => {
                console.error('Failed to fetch issue:', err);
                this.snackbarService.error('Failed to load issue. Please try again.');
                this.router.navigate(['/project', this.projectId(), 'issues']);
            },
        });
    }

    /**
     * Handles the event when the issue form is submitted with updated data.
     * @param updatedIssue the partial issue data containing the fields that were updated in the form.
     */
    onIssueUpdated(updatedIssue: Partial<Issue>): void {
        this.issueService
            .updateIssue(this.issueId(), updatedIssue)
            .pipe(
                finalize(() => {
                    this.isSubmitting.set(false);
                })
            )
            .subscribe({
                next: () => {
                    this.snackbarService.success('Issue updated successfully');
                    this.router.navigate(['/project', this.projectId(), 'issues'], {
                        relativeTo: this.activateRoute,
                    });
                },
                error: (err) => {
                    console.error('Failed to update issue:', err);
                    this.snackbarService.error('Failed to update issue. Please try again.');
                },
            });
    }
}
