import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { Issue } from '../../../shared/model/Issue';
import { ViewComponent } from './view/view.component';
import { finalize } from 'rxjs';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-view-issue',
    imports: [CommonModule, MatIcon, ViewComponent],
    templateUrl: './view-issue.component.html',
    styleUrl: './view-issue.component.css',
})
export class ViewIssueComponent implements OnInit {
    private readonly issueService = inject(IssueService);
    private readonly snackbarSerivce = inject(SnackbarService);

    // angular automatically binds the URL parameters to these signals
    issueId = input.required<string>();
    projectId = input.required<string>();
    organizationId = input.required<string>();

    issue = signal<Issue | null>(null);
    loading = signal<boolean>(true);

    ngOnInit() {
        const id = this.issueId();
        const projectId = this.projectId();
        const organizationId = this.organizationId();

        if (!id || !projectId || !organizationId) {
            this.loading.set(false);
            return;
        }

        this.issueService
            .getIssueById({
                issueId: id,
                projectId: projectId,
                organizationId: organizationId,
            })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (issue) => {
                    this.issue.set(issue);
                },
                error: (err) => {
                    console.error('Error fetching issue:', err);
                    this.snackbarSerivce.error('Failed to load issue. Please try again later.');
                },
            });
    }
}
