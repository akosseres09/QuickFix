import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
    Issue,
    PRIORITY_COLOR_MAP,
    PRIORITY_MAP,
    STATUS_COLOR_MAP,
    STATUS_MAP,
    TYPE_COLOR_MAP,
    TYPE_MAP,
} from '../../shared/model/Issue';
import { IssueService } from '../../shared/services/issue/issue.service';
import { CommonModule } from '@angular/common';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { TableComponent } from '../../common/table/table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { SpeedDialButton } from '../../shared/constants/SpeedDialButton';
import { UrlService } from '../../shared/services/url/url.service';
import { Sort, SortDirection } from '@angular/material/sort';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateService } from '../../shared/services/date/date.service';
import { Filter } from '../../shared/constants/Filter';
import { FilterComponent } from '../../common/filter/filter.component';

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
    private readonly dateService = inject(DateService);

    projectId = signal<string>(this.getProjectId());
    selectedRowId = signal<string | null>(null);

    pageSize = signal<number>(20);
    pageIndex = signal<number>(0);
    sortActive = signal<string>('');
    sortDirection = signal<SortDirection>('asc');

    totalCount = signal<number>(0);
    isLoading = signal<boolean>(false);

    issues = signal<Issue[]>([]);
    filteredIssues = signal<Issue[]>(this.issues());
    shownIssues = computed(() => new MatTableDataSource<Issue>(this.filteredIssues()));
    displayedColumns: Array<DisplayedColumn<Issue>> = [
        {
            id: 'title',
            label: 'Title',
            sortable: false,
            value: (e: Issue) => e.title,
            routerLink: (e: Issue) => ['/issues', e.id],
        },
        {
            id: 'author',
            label: 'Author',
            sortable: false,
            value: (e: Issue) => e.creator?.username || '',
            routerLink: (e: Issue) => {
                if (!e.creator?.username) return null;
                return ['/users/', '@' + e.creator.username];
            },
        },

        {
            id: 'assignee',
            label: 'Assignee',
            sortable: false,
            value: (e: Issue) => e.assignee?.username || 'None',
            routerLink: (e: Issue) => {
                if (!e.assignee?.username) return null;
                return ['/users/', '@' + e.assignee.username];
            },
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            badge: (e: Issue) => STATUS_COLOR_MAP[e.status],
            value: (e: Issue) => STATUS_MAP[e.status],
        },
        {
            id: 'priority',
            label: 'Priority',
            sortable: true,
            badge: (e: Issue) => PRIORITY_COLOR_MAP[e.priority],
            value: (e: Issue) => PRIORITY_MAP[e.priority],
        },
        {
            id: 'type',
            label: 'Type',
            sortable: true,
            badge: (e: Issue) => TYPE_COLOR_MAP[e.type],
            value: (e: Issue) => TYPE_MAP[e.type],
        },
        {
            id: 'createdAt',
            label: 'Created At',
            sortable: true,
            value: (e: Issue) => {
                const date = this.dateService.parseTimestamp(e.createdAt);
                return this.dateService.toLocaleISOString(date).split('T')[0];
            },
        },
    ];
    // Transform the signal into a computed signal
    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selectedId = this.selectedRowId();
        const currentProjectId = this.projectId();

        return [
            {
                iconName: 'add',
                label: 'Create Issue',
                shown: selectedId === null,
                action: () => {
                    return ['add'];
                },
            },
            {
                iconName: 'edit',
                label: 'Edit Issue',
                shown: selectedId !== null,
                action: () => {
                    const selectedIssueId = this.selectedRowId();
                    if (!selectedIssueId) {
                        this.snackbarService.open('Please select a valid issue to edit!');
                        return null;
                    }

                    return ['/project', currentProjectId, 'issue', selectedIssueId, 'edit'];
                },
            },
        ];
    });

    speedDial = viewChild<SpeedDialComponent>('speedDial');

    filters = signal<ApiQueryParams>({});
    isInitialFilterLoad = true;
    filteredFields: Filter[] = [
        {
            name: 'title',
            type: 'input',
        },
        {
            name: 'status',
            type: 'select',
            options: Object.entries(STATUS_MAP).map(([value, label]) => ({ value, label })),
        },
        {
            name: 'priority',
            type: 'select',
            options: Object.entries(PRIORITY_MAP).map(([value, label]) => ({ value, label })),
        },
        {
            name: 'type',
            type: 'select',
            options: Object.entries(TYPE_MAP).map(([value, label]) => ({ value, label })),
        },
    ];

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
     * @param project The currently selected project. If null, it means the selection was cleared.
     */
    onRowChange(issue: Issue | null) {
        if (!issue) {
            this.selectedRowId.set(null);
            this.speedDial()?.close();
            return;
        }

        this.selectedRowId.set(issue.id);

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
