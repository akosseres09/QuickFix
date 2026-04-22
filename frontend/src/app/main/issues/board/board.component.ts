import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
    CdkDropList,
    CdkDrag,
    CdkDragDrop,
    moveItemInArray,
    transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Issue } from '../../../shared/model/Issue';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { LabelService } from '../../../shared/services/label/label.service';
import { Label } from '../../../shared/model/Label';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { BoardColumnComponent } from './board-column/board-column.component';
import { finalize, forkJoin, map } from 'rxjs';

interface Column {
    label: Label;
    issues: Issue[];
}

@Component({
    selector: 'app-board',
    imports: [CommonModule, CdkDropList, CdkDrag, BoardColumnComponent],
    templateUrl: './board.component.html',
    styleUrl: './board.component.css',
})
export class BoardComponent implements OnInit {
    private readonly issueService = inject(IssueService);
    private readonly labelService = inject(LabelService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    projectId = input.required<string>();
    organizationId = input.required<string>();

    isLoading = signal<boolean>(true);

    columns = signal<Column[]>([]);

    connectedLists = computed(() => this.columns().map((c) => `label-${c.label.id}`));

    ngOnInit() {
        this.loadBoardData();
    }

    loadBoardData() {
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

        this.isLoading.set(true);

        forkJoin({
            labels: this.labelService
                .getLabelsToProject({ organizationId, projectId })
                .pipe(map((res) => res.items)),
            issues: this.issueService.getIssuesSimple({
                projectId,
                organizationId,
                queryParams: {
                    expand: 'assignee',
                },
            }),
        })
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                })
            )
            .subscribe({
                next: (data) => {
                    this.buildColumns(data.labels, data.issues);
                },
                error: (error) => {
                    console.error('Error loading board data:', error);
                    this.snackbarService.error('Failed to load board data');
                },
            });
    }

    buildColumns(labels: Label[], issues: Issue[]) {
        const newColumns: Column[] = labels.map((label) => {
            return {
                label,
                issues: issues.filter((issue) => issue.statusLabel === label.id),
            };
        });

        this.columns.set(newColumns);
    }

    onDrop(event: CdkDragDrop<Issue[]>, newLabelId: string) {
        if (event.previousContainer === event.container) {
            return;
        }

        const issue = event.previousContainer.data[event.previousIndex];
        const previousLabelId = issue.statusLabel;

        transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
        );

        issue.statusLabel = newLabelId;

        this.issueService
            .updateIssue({
                issueId: issue.id,
                projectId: this.projectId(),
                organizationId: this.organizationId(),
                issue: { statusLabel: issue.statusLabel === '' ? null! : issue.statusLabel },
            })
            .subscribe({
                next: () => {
                    this.snackbarService.success(`Issue ${issue.issueKey} moved`);
                },
                error: (error) => {
                    console.error('Error updating issue:', error);
                    this.snackbarService.error('Failed to update issue label');

                    issue.statusLabel = previousLabelId;

                    const columns = this.columns();
                    const targetCol = columns.find((c) => c.label.id === newLabelId);
                    const sourceCol = columns.find((c) => c.label.id === (previousLabelId || ''));

                    if (targetCol && sourceCol) {
                        transferArrayItem(
                            targetCol.issues,
                            sourceCol.issues,
                            event.currentIndex,
                            event.previousIndex
                        );
                    }
                },
            });
    }

    onColumnDrop(event: CdkDragDrop<Column[]>) {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        const columns = [...this.columns()];

        // Prevent moving the first or last column, or dropping before first/after last
        if (
            event.previousIndex === 0 ||
            event.previousIndex === columns.length - 1 ||
            event.currentIndex === 0 ||
            event.currentIndex === columns.length - 1
        ) {
            return;
        }

        moveItemInArray(columns, event.previousIndex, event.currentIndex);
        this.columns.set(columns);

        const movedColumn = columns[event.currentIndex];

        let finalIndex = event.currentIndex;

        this.labelService
            .reorderLabel({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
                labelId: movedColumn.label.id,
                newIndex: finalIndex,
            })
            .subscribe({
                next: () => {},
                error: (err) => {
                    console.error('Error reordering column:', err);
                    const reverted = [...this.columns()];
                    moveItemInArray(reverted, event.currentIndex, event.previousIndex);
                    this.columns.set(reverted);
                },
            });
    }

    sortPredicate = (index: number, drag: CdkDrag<any>, drop: CdkDropList<any>) => {
        return index > 0 && index < this.columns().length - 1;
    };
}
