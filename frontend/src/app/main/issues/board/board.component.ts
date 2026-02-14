import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDropListGroup, CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import {
    Issue,
    STATUS_OPEN,
    STATUS_IN_PROGRESS,
    STATUS_REVIEW,
    STATUS_RESOLVED,
    STATUS_CLOSED,
    STATUS_MAP,
} from '../../../shared/model/Issue';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { BoardColumnComponent } from './board-column/board-column.component';

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
    STATUS_OPEN = STATUS_OPEN;
    STATUS_IN_PROGRESS = STATUS_IN_PROGRESS;
    STATUS_REVIEW = STATUS_REVIEW;
    STATUS_RESOLVED = STATUS_RESOLVED;
    STATUS_CLOSED = STATUS_CLOSED;
    STATUS_MAP = STATUS_MAP;

    // Issue arrays grouped by status
    openIssues = signal<Issue[]>([]);
    inProgressIssues = signal<Issue[]>([]);
    reviewIssues = signal<Issue[]>([]);
    resolvedIssues = signal<Issue[]>([]);
    closedIssues = signal<Issue[]>([]);

    // Connected drop list IDs
    columnIds = ['status-0', 'status-1', 'status-2', 'status-3', 'status-4'];

    ngOnInit() {
        const id = this.route.parent?.parent?.snapshot.paramMap.get('projectId');

        if (!id) {
            this.snackbarService.open('Project ID is missing', ['snackbar-error']);
            return;
        }

        this.projectId.set(id);
        this.issueService.setProjectId(id);
        this.loadIssues();
    }

    loadIssues() {
        this.isLoading.set(true);
        this.issueService
            .getIssuesSimple({
                expand: 'assignee',
            })
            .subscribe({
                next: (issues) => {
                    this.groupIssuesByStatus(issues);
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error loading issues:', error);
                    this.snackbarService.open('Failed to load issues', ['snackbar-error']);
                    this.isLoading.set(false);
                },
            });
    }

    groupIssuesByStatus(issues: Issue[]) {
        this.openIssues.set(issues.filter((issue) => issue.status === STATUS_OPEN));
        this.inProgressIssues.set(issues.filter((issue) => issue.status === STATUS_IN_PROGRESS));
        this.reviewIssues.set(issues.filter((issue) => issue.status === STATUS_REVIEW));
        this.resolvedIssues.set(issues.filter((issue) => issue.status === STATUS_RESOLVED));
        this.closedIssues.set(issues.filter((issue) => issue.status === STATUS_CLOSED));
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
        this.issueService.updateIssue(issue.id, { status: status }).subscribe({
            next: () => {
                this.snackbarService.open(
                    `Issue ${issue.issueKey} moved to ${STATUS_MAP[newStatus]}`
                );
            },
            error: (error) => {
                console.error('Error updating issue:', error);
                this.snackbarService.open('Failed to update issue status', ['snackbar-error']);

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
            case STATUS_OPEN:
                return this.openIssues();
            case STATUS_IN_PROGRESS:
                return this.inProgressIssues();
            case STATUS_REVIEW:
                return this.reviewIssues();
            case STATUS_RESOLVED:
                return this.resolvedIssues();
            case STATUS_CLOSED:
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
