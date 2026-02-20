import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Issue, PRIORITY_MAP, STATUS_MAP, TYPE_MAP } from '../../shared/model/Issue';
import { IssueService } from '../../shared/services/issue/issue.service';
import { CommonModule } from '@angular/common';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { TableComponent } from '../../common/table/table.component';
import { ActivatedRoute } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { SpeedDialButton } from '../../shared/constants/SpeedDialButton';
import { UrlService } from '../../shared/services/url/url.service';
import { Sort, SortDirection } from '@angular/material/sort';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Filter } from '../../shared/constants/Filter';
import { FilterComponent } from '../../common/filter/filter.component';
import { DialogService } from '../../shared/services/dialog/dialog.service';
import { finalize } from 'rxjs';
import { DisplayedColumnService } from '../../shared/services/displayed-column/displayed-column.service';
import { FilterService } from '../../shared/services/filter/filter.service';

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
    private readonly urlService = inject(UrlService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly issueService = inject(IssueService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly dialogService = inject(DialogService);
    private readonly displayedColumService = inject(DisplayedColumnService);
    private readonly filterService = inject(FilterService);

    projectId = signal<string>(this.getProjectId());
    selectedRow = signal<Issue | null>(null);

    pageSize = signal<number>(20);
    pageIndex = signal<number>(0);
    sortActive = signal<string>('');
    sortDirection = signal<SortDirection>('asc');

    totalCount = signal<number>(0);
    isLoading = signal<boolean>(false);

    issues = signal<Issue[]>([]);
    filteredIssues = signal<Issue[]>(this.issues());
    shownIssues = computed(() => new MatTableDataSource<Issue>(this.filteredIssues()));
    displayedColumns: Array<DisplayedColumn<Issue>> =
        this.displayedColumService.getIssueDisplayColumns();

    // Transform the signal into a computed signal
    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selectedRow = this.selectedRow();
        const currentProjectId = this.projectId();

        return [
            {
                iconName: 'add',
                label: 'Create Issue',
                shown: selectedRow === null,
                action: () => {
                    return ['add'];
                },
            },
            {
                iconName: 'archive',
                label: 'Archive Issue',
                shown: selectedRow !== null && !selectedRow.isArchived,
                onClick: () => {
                    this.openArchiveConfirmation();
                },
            },
            {
                iconName: 'unarchive',
                label: 'Unarchive Issue',
                shown: selectedRow !== null && selectedRow.isArchived,
                onClick: () => {
                    this.openUnarchiveConfirmation();
                },
            },
            {
                iconName: 'edit',
                label: 'Edit Issue',
                shown: selectedRow !== null,
                action: () => {
                    const selectedIssueId = this.selectedRow()?.id;
                    if (!selectedIssueId) {
                        this.snackbarService.open('Please select a valid issue to edit!');
                        return null;
                    }

                    return ['/project', currentProjectId, 'issue', selectedIssueId, 'edit'];
                },
            },
        ];
    });

    filters = signal<ApiQueryParams>({});
    isInitialFilterLoad = true;
    filteredFields: Filter[] = this.filterService.getIssueFilters();

    // template refs
    speedDial = viewChild<SpeedDialComponent>('speedDial');
    archiveConfirmTemplate = viewChild<any>('archiveConfirmTemplate');
    unarchiveConfirmTemplate = viewChild<any>('unarchiveConfirmTemplate');

    constructor() {
        const pageSizeParam = this.activeRoute.snapshot.queryParamMap.get('pageSize');
        const pageIndexParam = this.activeRoute.snapshot.queryParamMap.get('page');
        const sortActiveParam = this.activeRoute.snapshot.queryParamMap.get('sort');

        if (pageSizeParam) {
            this.pageSize.set(+pageSizeParam);
        }

        if (pageIndexParam) {
            // Convert from 1-based (URL/API) to 0-based (Material table)
            this.pageIndex.set(+pageIndexParam - 1);
        }

        if (sortActiveParam) {
            const isAsc = !sortActiveParam.startsWith('-');
            this.sortActive.set(isAsc ? sortActiveParam : sortActiveParam.substring(1));
            this.sortDirection.set(isAsc ? 'asc' : 'desc');
        }

        this.issueService.setProjectId(this.projectId());
    }

    private getProjectId(): string {
        return this.activeRoute.parent?.parent?.snapshot.paramMap.get('projectId') || '';
    }

    getIssues() {
        if (!this.projectId()) {
            this.snackbarService.open('Project ID is missing');
            return;
        }

        this.isLoading.set(true);

        this.issueService
            .getIssues(this.buildQueryParams())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.issues.set(response.items);
                    this.filteredIssues.set(response.items);
                    this.totalCount.set(response._meta.totalCount);
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error('Error fetching issues:', error);
                    this.snackbarService.open('Failed to load issues');
                    this.isLoading.set(false);
                },
            });
    }

    /**
     * Handles sort change events from the table, updates the URL and fetches new data.
     * @param event Sort event emitted from the table when user changes sorting.
     */
    onSortChange(event: Sort) {
        this.sortActive.set(event.active);
        this.sortDirection.set(event.direction);

        if (event.direction === '') {
            this.urlService.removeQueryParams(['sort']);
        } else {
            const direction = event.direction === 'asc' ? '' : '-';
            this.urlService.addQueryParams({
                sort: `${direction}${event.active}`,
            });
        }

        this.pageIndex.set(0);
        this.getIssues();
    }

    /**
     * Handles page change events from the paginator, updates the URL and fetches new data.
     * @param event PageEvent emitted from paginator. Holds the new page index and size.
     */
    onPageChange(event: PageEvent) {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);

        this.urlService.addQueryParams({
            page: event.pageIndex + 1,
            pageSize: event.pageSize,
        });

        this.getIssues();
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
     * Updates the filters signal, resets pagination, updates URL and fetches new data.
     * @param filterParams
     */
    onFilterChange(filterParams: ApiQueryParams) {
        this.filters.set(filterParams);

        // Reset to first page on filter change, but not on initial load
        if (!this.isInitialFilterLoad) {
            this.pageIndex.set(0);
            this.urlService.removeQueryParams(['page']);
        }
        this.isInitialFilterLoad = false;

        this.setQueryParams();
        this.getIssues();
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
            this.snackbarService.open('Error opening confirmation dialog', ['snackbar-error']);
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
            this.snackbarService.open('No Issue selected', ['snackbar-error']);
            return;
        }

        this.issueService
            .updateIssue(issue.id, {
                isArchived: true,
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
                    this.snackbarService.open('Issue archived successfully!');
                },
                error: (err) => {
                    this.snackbarService.open('Failed to archive issue!', ['snackbar-error']);
                },
            });
    }

    unarchiveIssue() {
        const issue = this.selectedRow();
        if (!issue) {
            this.snackbarService.open('No Issue selected', ['snackbar-error']);
            return;
        }

        this.issueService
            .updateIssue(issue.id, {
                isArchived: false,
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
                    this.snackbarService.open('Issue unarchived successfully!');
                },
                error: (err) => {
                    this.snackbarService.open('Failed to unarchive issue!', ['snackbar-error']);
                },
            });
    }

    private setQueryParams() {
        this.urlService.addQueryParams(this.buildUrlParams());
    }

    /**
     * Builds unified query params from all sources:
     * - Filter form values
     * - Pagination state
     * - Sorting state
     * - Expansion requirements
     */
    private buildQueryParams(): ApiQueryParams {
        const params: ApiQueryParams = {
            ...this.filters(),
            // Convert from 0-based (Material table) to 1-based (API)
            page: this.pageIndex() > 0 ? this.pageIndex() + 1 : null,
            pageSize: this.pageSize() !== 20 ? this.pageSize() : null,
            sort: this.sortDirection()
                ? `${this.sortDirection() === 'desc' ? '-' : ''}${this.sortActive()}`
                : null,
            expand: 'creator,assignee',
        };

        return params;
    }

    /**
     * Builds query params for URL (excludes 'expand' and filters out null/empty values)
     */
    private buildUrlParams(): ApiQueryParams {
        const params = this.buildQueryParams();
        const { expand, ...urlParams } = params;

        // Filter out null/undefined/empty values
        const cleanParams: ApiQueryParams = {};
        Object.entries(urlParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                cleanParams[key] = value;
            } else {
                cleanParams[key] = null;
            }
        });

        return cleanParams;
    }
}
