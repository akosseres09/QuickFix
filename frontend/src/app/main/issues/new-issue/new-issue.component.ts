import { Component, inject, input, signal } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
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
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { finalize } from 'rxjs';

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
    templateUrl: './new-issue.component.html',
    styleUrl: './new-issue.component.css',
})
export class NewIssueComponent {
    private readonly issueService = inject(IssueService);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly routerOptions: NavigationExtras = {
        relativeTo: this.activeRoute,
    };

    isSubmitting = signal<boolean>(false);

    projectId = input.required<string>();
    organizationId = input.required<string>();

    /**
     * Handles issue creation when the form is submitted.
     * @param issue the data emitted from the issue form, containing the new issue details.
     */
    onIssueCreated(issue: Partial<Issue>): void {
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

        this.isSubmitting.set(true);

        this.issueService
            .createIssue(
                {
                    projectId: projectId,
                    organizationId: organizationId,
                },
                issue
            )
            .pipe(
                finalize(() => {
                    this.isSubmitting.set(false);
                })
            )
            .subscribe({
                next: (_) => {
                    this.snackbarService.success(`Issue created successfully!`);
                    this.router.navigate(['..'], this.routerOptions);
                },
                error: (error) => {
                    this.snackbarService.error(
                        error.error.message || 'Failed to create issue. Please try again.'
                    );
                },
            });
    }
}
