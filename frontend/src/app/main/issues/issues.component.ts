import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Issue } from '../../shared/model/Issue';
import { IssueService } from '../../shared/services/issue/issue.service';
import { CommonModule } from '@angular/common';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { TableComponent } from '../../common/table/table.component';
import { ActivatedRoute } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { SpeedDialButton } from '../../shared/constants/speed-dial/SpeedDialButton';
import { Sort } from '@angular/material/sort';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { Filter } from '../../shared/constants/Filter';
import { FilterComponent } from '../../common/filter/filter.component';
import { DialogService } from '../../shared/services/dialog/dialog.service';
import { finalize } from 'rxjs';
import { DisplayedColumnService } from '../../shared/services/displayed-column/displayed-column.service';
import { FilterService } from '../../shared/services/filter/filter.service';
import { SpeedDialButtonFactory } from '../../shared/services/speed-dial/speed-dial-button.factory';
import { ListState } from '../../shared/constants/table/ListState';
import { ListStateService } from '../../shared/services/list-state/list-state.service';

@Component({
    selector: 'app-issues',
    imports: [
        MatTableModule,
        MatPaginatorModule,
        CommonModule,
        TableComponent,
        SpeedDialComponent,
        FilterComponent,
    ],
    templateUrl: './issues.component.html',
    styleUrl: './issues.component.css',
})
export class IssuesComponent {
    private readonly snackbarService = inject(SnackbarService);
    private readonly issueService = inject(IssueService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly displayedColumService = inject(DisplayedColumnService);
    private readonly filterService = inject(FilterService);
    private readonly listStateService = inject(ListStateService);
    private readonly dialogService = inject(DialogService);
    private readonly buttonFactory = inject(SpeedDialButtonFactory);

    // List state (pagination, sorting, filtering)
    readonly listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 20,
        expand: 'creator,assignee',
    });

    projectId = input.required<string>();
    organizationId = input.required<string>();

    selectedRow = signal<Issue | null>(null);

    filteredIssues = signal<Issue[]>([]);
    shownIssues = computed(() => new MatTableDataSource<Issue>(this.filteredIssues()));
    displayedColumns: Array<DisplayedColumn<Issue>> =
        this.displayedColumService.getIssueDisplayColumns();

    // Transform the signal into a computed signal
    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selected = this.selectedRow();

        return this.buttonFactory.createArchivableButtons({
            entityName: 'Issue',
            hasSelection: selected !== null,
            isArchived: selected?.isArchived ?? false,
            createRoute: ['add'],
            editRouteBuilder: () => {
                const issueId = this.selectedRow()?.id;
                if (!issueId) {
                    this.snackbarService.error('Please select a valid issue to edit!');
                    return null;
                }
                return ['../issue', issueId, 'edit'];
            },
            onArchive: () => this.openArchiveConfirmation(),
            onUnarchive: () => this.openUnarchiveConfirmation(),
        });
    });

    filteredFields: Filter[] = this.filterService.getIssueFilters();

    // template refs
    speedDial = viewChild<SpeedDialComponent>('speedDial');
    archiveConfirmTemplate = viewChild<any>('archiveConfirmTemplate');
    unarchiveConfirmTemplate = viewChild<any>('unarchiveConfirmTemplate');

    getIssues() {
        const projectId = this.projectId();
        const organizationId = this.organizationId();
        if (!projectId) {
            this.snackbarService.error('Project ID is missing');
            return;
        }

        if (!organizationId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.listState.isLoading.set(true);

        this.issueService
            .getIssues({ projectId, organizationId }, this.listState.buildQueryParams())
            .pipe(finalize(() => this.listState.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.filteredIssues.set(response.items);
                    this.listState.totalCount.set(response._meta.totalCount);
                },
                error: (error) => {
                    console.error('Error fetching issues:', error);
                    this.snackbarService.error('Failed to load issues');
                },
            });
    }

    /**
     * Handles sort change events from the table, updates the URL and fetches new data.
     */
    onSortChange(event: Sort) {
        this.listState.onSortChange(event, () => this.getIssues());
    }

    /**
     * Handles page change events from the paginator, updates the URL and fetches new data.
     */
    onPageChange(event: PageEvent) {
        this.listState.onPageChange(event, () => this.getIssues());
    }

    /**
     * Handles row selection changes from the custom table.
     * @param issue The currently selected issue. If null, it means the selection was cleared.
     */
    onRowChange(issue: Issue | null) {
        if (!issue) {
            this.selectedRow.set(null);
            this.speedDial()?.close();
            return;
        }

        this.selectedRow.set(issue);

        if (issue && this.speedDial()?.isOpen()) return;

        this.speedDial()?.onTogglerClick();
    }

    /**
     * Handles filter changes emitted from the ProjectFilterComponent.
     */
    onFilterChange(filterParams: ApiQueryParams) {
        this.listState.onFilterChange(filterParams, () => this.getIssues());
    }

    openArchiveConfirmation() {
        const template = this.archiveConfirmTemplate();
        if (!template) {
            this.snackbarService.open('Error opening confirmation dialog', ['snackbar-error']);
            return;
        }

        const dialogRef = this.dialogService.openConfirmDialog('Archive Issue', template, {
            confirmLabel: 'Archive',
            cancelLabel: 'Cancel',
            width: '450px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.action === 'save') {
                this.archiveIssue();
            }
        });
    }

    openUnarchiveConfirmation() {
        const template = this.unarchiveConfirmTemplate();
        if (!template) {
            this.snackbarService.error('Error opening confirmation dialog');
            return;
        }

        const dialogRef = this.dialogService.openConfirmDialog('Unarchive Issue', template, {
            confirmLabel: 'Unarchive',
            cancelLabel: 'Cancel',
            width: '450px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.action === 'save') {
                this.unarchiveIssue();
            }
        });
    }

    archiveIssue() {
        const issue = this.selectedRow();
        if (!issue) {
            this.snackbarService.error('No Issue selected');
            return;
        }

        const projectId = this.projectId();
        if (!projectId) {
            this.snackbarService.error('Project ID is missing');
            return;
        }

        const organizationId = this.organizationId();
        if (!organizationId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.issueService
            .updateIssue({
                issueId: issue.id,
                projectId: projectId,
                organizationId: organizationId,
                issue: {
                    isArchived: true,
                },
            })
            .pipe(
                finalize(() => {
                    this.selectedRow.set(null);
                    this.speedDial()?.close();
                    this.getIssues();
                })
            )
            .subscribe({
                next: () => {
                    this.snackbarService.success('Issue archived successfully!');
                },
                error: (err) => {
                    this.snackbarService.error('Failed to archive issue!');
                },
            });
    }

    unarchiveIssue() {
        const issue = this.selectedRow();
        if (!issue) {
            this.snackbarService.error('No Issue selected');
            return;
        }

        const projectId = this.projectId();
        if (!projectId) {
            this.snackbarService.error('Project ID is missing');
            return;
        }

        const organizationId = this.organizationId();
        if (!organizationId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.issueService
            .updateIssue({
                issueId: issue.id,
                projectId: projectId,
                organizationId: organizationId,
                issue: {
                    isArchived: false,
                },
            })
            .pipe(
                finalize(() => {
                    this.selectedRow.set(null);
                    this.speedDial()?.close();
                    this.getIssues();
                })
            )
            .subscribe({
                next: () => {
                    this.snackbarService.success('Issue unarchived successfully!');
                },
                error: (err) => {
                    this.snackbarService.error('Failed to unarchive issue!');
                },
            });
    }
}
