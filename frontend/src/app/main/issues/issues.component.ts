import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Issue, PRIORITY_MAP, STATUS_MAP, TYPE_MAP } from '../../shared/model/Issue';
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

@Component({
    selector: 'app-issues',
    imports: [MatTableModule, MatPaginatorModule, CommonModule, TableComponent, SpeedDialComponent],
    templateUrl: './issues.component.html',
    styleUrl: './issues.component.css',
})
export class IssuesComponent {
    private readonly urlService = inject(UrlService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly issueService = inject(IssueService);
    private readonly router = inject(Router);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly dateService = inject(DateService);

    projectId = signal<string>(this.getProjectId());

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
            routerLink: (e: Issue) => ['/users', e.createdBy],
        },

        {
            id: 'assignee',
            label: 'Assignee',
            sortable: false,
            value: (e: Issue) => e.assignee?.username || 'None',
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            badge: true,
            value: (e: Issue) => STATUS_MAP[e.status],
        },
        {
            id: 'priority',
            label: 'Priority',
            sortable: true,
            badge: true,
            value: (e: Issue) => PRIORITY_MAP[e.priority],
        },
        {
            id: 'type',
            label: 'Type',
            sortable: true,
            badge: true,
            value: (e: Issue) => TYPE_MAP[e.type],
        },
        {
            id: 'createdAt',
            label: 'Created At',
            sortable: true,
            value: (e: Issue) => {
                const date = this.dateService.parseDate(e.createdAt);
                return this.dateService.toLocaleISOString(date).split('T')[0];
            },
        },
    ];
    speedDialButtons: SpeedDialButton[] = [
        {
            iconName: 'add',
            label: 'Create Issue',
            action: () => {
                this.router.navigate(['add'], {
                    relativeTo: this.activeRoute,
                });
            },
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
            this.pageIndex.set(+pageIndexParam);
        }

        if (sortActiveParam) {
            const isAsc = !sortActiveParam.startsWith('-');
            this.sortActive.set(isAsc ? sortActiveParam : sortActiveParam.substring(1));
            this.sortDirection.set(isAsc ? 'asc' : 'desc');
        }
        this.issueService.setProjectId(this.projectId());
        this.getIssues();
    }

    private getProjectId(): string {
        return this.activeRoute.parent?.parent?.snapshot.paramMap.get('projectId') || '';
    }

    private buildQueryParams(): ApiQueryParams {
        const params: ApiQueryParams = {
            page: this.pageIndex() > 0 ? this.pageIndex() + 1 : null,
            pageSize: this.pageSize() !== 20 ? this.pageSize() : null,
            sort: this.sortDirection()
                ? `${this.sortDirection() === 'desc' ? '-' : ''}${this.sortActive()}`
                : null,
            expand: 'creator,assignee',
        };

        return params;
    }

    getIssues() {
        if (!this.projectId()) {
            this.snackbarService.open('Project ID is missing');
            return;
        }

        this.isLoading.set(true);
        const queryParams = this.buildQueryParams();

        this.issueService
            .getIssues(queryParams)
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

    onPageChange(event: PageEvent) {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);

        this.urlService.addQueryParams({
            page: event.pageIndex + 1,
            pageSize: event.pageSize,
        });

        this.getIssues();
    }

    onEdit(issue: Issue) {
        this.snackbarService.open('Navigating to issue ' + issue.id);
        //this.router.navigate(['/issues', issue.id]);
    }

    onDelete(issue: Issue) {
        this.snackbarService.open('Issue deleted');
        // Not implemented
    }
}
