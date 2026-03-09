import { Component, inject, input, OnInit, signal } from '@angular/core';
import { IssueFormComponent } from '../../../common/form/issue-form/issue-form.component';
import { Issue } from '../../../shared/model/Issue';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
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
export class EditIssueComponent implements OnInit {
    private readonly issueService = inject(IssueService);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly routerOptions: NavigationExtras = {
        relativeTo: this.activeRoute,
    };

    projectId = input.required<string>();
    organizationId = input.required<string>();
    issueId = input.required<string>();

    issue = signal<Issue | null>(null);
    isSubmitting = signal<boolean>(false);

    ngOnInit() {
        const projectId = this.projectId();
        const organizationId = this.organizationId();
        const issueId = this.issueId();

        if (!organizationId || !projectId || !issueId) {
            console.error('One of the required ids are missing!');
            this.router.navigate(['..'], this.routerOptions);
            return;
        }

        this.issueService
            .getIssueById({
                projectId: projectId,
                organizationId: organizationId,
                issueId: this.issueId(),
            })
            .subscribe({
                next: (issue) => {
                    this.issue.set(issue);
                },
                error: (err) => {
                    console.error('Failed to fetch issue:', err);
                    this.snackbarService.error('Failed to load issue. Please try again.');
                    this.router.navigate(['../../../'], this.routerOptions);
                },
            });
    }

    /**
     * Handles the event when the issue form is submitted with updated data.
     * @param updatedIssue the partial issue data containing the fields that were updated in the form.
     */
    onIssueUpdated(updatedIssue: Partial<Issue>): void {
        const projectId = this.projectId();
        if (!projectId) {
            console.error('Project ID is missing');
            return;
        }

        const organizationId = this.organizationId();
        if (!organizationId) {
            console.error('Organization ID is missing');
            return;
        }

        const issueId = this.issueId();
        if (!issueId) {
            console.error('Issue ID is missing');
            return;
        }

        this.issueService
            .updateIssue({
                issueId: issueId,
                projectId: projectId,
                organizationId: organizationId,
                issue: updatedIssue,
            })
            .pipe(
                finalize(() => {
                    this.isSubmitting.set(false);
                })
            )
            .subscribe({
                next: () => {
                    this.snackbarService.success('Issue updated successfully');
                    this.router.navigate(['../../../'], this.routerOptions);
                },
                error: (err) => {
                    console.error('Failed to update issue:', err);
                    this.snackbarService.error('Failed to update issue. Please try again.');
                },
            });
    }
}
