import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDropListGroup, CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { Issue, IssueStatus, STATUS_MAP } from '../../../shared/model/Issue';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { BoardColumnComponent } from './board-column/board-column.component';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-board',
    imports: [CommonModule, CdkDropListGroup, BoardColumnComponent],
    templateUrl: './board.component.html',
    styleUrl: './board.component.css',
})
export class BoardComponent implements OnInit {
    private readonly issueService = inject(IssueService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    projectId = signal<string>('');
    isLoading = signal<boolean>(true);

    // Status constants for template
    StatusEnum = IssueStatus;
    STATUS_MAP = STATUS_MAP;

    // Issue arrays grouped by status
    openIssues = signal<Issue[]>([]);
    inProgressIssues = signal<Issue[]>([]);
    reviewIssues = signal<Issue[]>([]);
    resolvedIssues = signal<Issue[]>([]);
    closedIssues = signal<Issue[]>([]);

    ngOnInit() {
        const id = this.route.parent?.parent?.snapshot.paramMap.get('projectId');

        if (!id) {
            this.snackbarService.error('Project ID is missing');
            return;
        }

        this.projectId.set(id);
        this.loadIssues();
    }

    loadIssues() {
        this.isLoading.set(true);
        this.issueService
            .getIssuesSimple({
                projectId: this.projectId(),
                queryParams: {
                    expand: 'assignee',
                },
            })
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                })
            )
            .subscribe({
                next: (issues) => {
                    this.groupIssuesByStatus(issues);
                },
                error: (error) => {
                    console.error('Error loading issues:', error);
                    this.snackbarService.error('Failed to load issues');
                },
            });
    }

    groupIssuesByStatus(issues: Issue[]) {
        this.openIssues.set(issues.filter((issue) => issue.status === IssueStatus.OPEN));
        this.inProgressIssues.set(
            issues.filter((issue) => issue.status === IssueStatus.IN_PROGRESS)
        );
        this.reviewIssues.set(issues.filter((issue) => issue.status === IssueStatus.REVIEW));
        this.resolvedIssues.set(issues.filter((issue) => issue.status === IssueStatus.RESOLVED));
        this.closedIssues.set(issues.filter((issue) => issue.status === IssueStatus.CLOSED));
    }

    onDrop(event: CdkDragDrop<Issue[]>, newStatus: number) {
        if (event.previousContainer === event.container) {
            // Same column, no need to update
            return;
        }

        const issue = event.previousContainer.data[event.previousIndex];
        const previousStatus = issue.status;

        // Optimistic UI update
        transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
        );

        // Update issue status
        const status = newStatus as Issue['status'];
        issue.status = status;

        // Update backend
        this.issueService
            .updateIssue({
                issueId: issue.id,
                projectid: this.projectId(),
                issue: { status: status },
            })
            .subscribe({
                next: () => {
                    this.snackbarService.success(
                        `Issue ${issue.issueKey} moved to ${STATUS_MAP[newStatus]}`
                    );
                },
                error: (error) => {
                    console.error('Error updating issue:', error);
                    this.snackbarService.error('Failed to update issue status');

                    // Rollback on error
                    issue.status = previousStatus;
                    const targetArray = this.getIssueArrayByStatus(newStatus);
                    const sourceArray = this.getIssueArrayByStatus(previousStatus);
                    transferArrayItem(
                        targetArray,
                        sourceArray,
                        event.currentIndex,
                        event.previousIndex
                    );
                },
            });
    }

    getIssueArrayByStatus(status: number): Issue[] {
        switch (status) {
            case IssueStatus.OPEN:
                return this.openIssues();
            case IssueStatus.IN_PROGRESS:
                return this.inProgressIssues();
            case IssueStatus.REVIEW:
                return this.reviewIssues();
            case IssueStatus.RESOLVED:
                return this.resolvedIssues();
            case IssueStatus.CLOSED:
                return this.closedIssues();
            default:
                return [];
        }
    }

    onIssueClick(issue: Issue) {
        this.router.navigate(['../', 'overview'], {
            relativeTo: this.route,
            queryParams: { issueId: issue.id },
        });
    }
}
