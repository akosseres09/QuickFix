import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableComponent } from '../../common/table/table.component';
import { Project } from '../../shared/model/Project';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { ApiQueryParams, ProjectService } from '../../shared/services/project/project.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
    MAT_FORM_FIELD_DEFAULT_OPTIONS,
    MatFormField,
    MatLabel,
} from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { debounce } from 'rxjs';
import { UrlService } from '../../shared/services/url/url.service';
import { ActivatedRoute } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateService } from '../../shared/services/date/date.service';
import { Sort, SortDirection } from '@angular/material/sort';

@Component({
    selector: 'app-projects',
    imports: [
        MatTableModule,
        MatPaginatorModule,
        CommonModule,
        TableComponent,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatOptionModule,
        MatFormField,
        MatInput,
        MatLabel,
        MatButton,
        SpeedDialComponent,
    ],
    providers: [
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    ],
    templateUrl: './projects.component.html',
    styleUrl: './projects.component.css',
})
export class ProjectsComponent implements OnInit {
    private readonly urlService = inject(UrlService);
    private readonly fb = inject(FormBuilder);
    private readonly projectService = inject(ProjectService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly dateService = inject(DateService);
    projects = signal<Project[]>([]);

    // Table state
    pageSize = signal<number>(10);
    pageIndex = signal<number>(0);
    sortActive = signal<string>('');
    sortDirection = signal<SortDirection>('asc');

    // Pagination metadata from server
    totalCount = signal<number>(0);
    isLoading = signal<boolean>(false);

    filterForm = this.fb.group({
        name: [this.activeRoute.snapshot.queryParamMap.get('name') || ''],
    });
    showFilterReset = signal<boolean>(this.activeRoute.snapshot.queryParamMap.has('name'));
    filteredProjects = signal<Project[]>([]);
    shownProjects = computed(() => new MatTableDataSource<Project>(this.filteredProjects()));
    displayedColumns = signal<DisplayedColumn<Project>[]>([
        {
            id: 'name',
            label: 'Name',
            sortable: true,
            value: (e: Project) => e.name,
            routerLink: (e: Project) => ['/projects', e.id],
        },
        {
            id: 'owner',
            label: 'Owner',
            sortable: false,
            value: (e: Project) => e.owner?.username || 'N/A',
            routerLink: (e: Project) => ['/users', e.owner?.id],
        },
        {
            id: 'users',
            label: '# of users',
            sortable: true,
            value: (e: Project) => e.members.length + 1,
        },
        {
            id: 'createdAt',
            label: 'Created At',
            sortable: true,
            value: (e: Project) => {
                const date = this.dateService.parseDate(e.createdAt);
                return this.dateService.toLocaleISOString(date).split('T')[0];
            },
        },
    ]);

    constructor() {
        this.filterForm.valueChanges
            .pipe(debounce(() => new Promise((resolve) => setTimeout(resolve, 300))))
            .subscribe((filters) => {
                // Update URL with filter params
                const urlFilters: Record<string, any> = { ...filters };
                Object.entries(urlFilters).forEach(([key, value]) => {
                    if (!value) {
                        urlFilters[key] = null;
                    }
                });

                this.showFilterReset.set(
                    Object.values(filters).some((value) => value !== null && value !== '')
                );

                this.urlService.addQueryParams(urlFilters);
                this.getProjects();
            });
    }

    ngOnInit(): void {
        // Initialize pagination and sorting from query params
        const pageSizeParam = this.activeRoute.snapshot.queryParamMap.get('pageSize');
        const pageParam = this.activeRoute.snapshot.queryParamMap.get('page');
        const sortParam = this.activeRoute.snapshot.queryParamMap.get('sort');

        if (pageSizeParam) {
            this.pageSize.set(+pageSizeParam);
        }
        if (pageParam) {
            this.pageIndex.set(+pageParam - 1);
        }
        if (sortParam) {
            const isAsc = !sortParam.startsWith('-');
            this.sortActive.set(isAsc ? sortParam : sortParam.substring(1));
            this.sortDirection.set(isAsc ? 'asc' : 'desc');
        }

        this.getProjects();
    }

    resetFilters() {
        this.filterForm.reset();
        this.showFilterReset.set(false);
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
            // Spread filter form values
            ...this.filterForm.value,

            // Add pagination (only if not default values)
            page: this.pageIndex() > 0 ? this.pageIndex() + 1 : null,
            pageSize: this.pageSize() !== 20 ? this.pageSize() : null,

            // Add sorting (only if sortDirection is not '')
            sort: this.sortDirection()
                ? `${this.sortDirection() === 'desc' ? '-' : ''}${this.sortActive()}`
                : null,

            // Add expansion
            expand: 'owner,members',
        };

        return params;
    }

    /**
     * Fetches projects from the server using current query params.
     * Updates the projects signal and pagination metadata.
     */
    getProjects() {
        this.isLoading.set(true);
        const queryParams = this.buildQueryParams();

        this.projectService
            .getProjects(queryParams)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.projects.set(response.items);
                this.filteredProjects.set(response.items);
                this.totalCount.set(response._meta.totalCount);
                this.isLoading.set(false);
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
        this.getProjects();
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

        this.getProjects();
    }
}
