import { CommonModule } from '@angular/common';
import {
    Component,
    computed,
    DestroyRef,
    inject,
    OnInit,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableComponent } from '../../common/table/table.component';
import {
    PRIORITY_COLOR_MAP,
    PRIORITY_MAP,
    Project,
    STATUS_COLOR_MAP,
    STATUS_MAP,
} from '../../shared/model/Project';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { ProjectService } from '../../shared/services/project/project.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { UrlService } from '../../shared/services/url/url.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateService } from '../../shared/services/date/date.service';
import { Sort, SortDirection } from '@angular/material/sort';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { SpeedDialButton } from '../../shared/constants/SpeedDialButton';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { Filter } from '../../shared/constants/Filter';
import { FilterComponent } from '../../common/filter/filter.component';
import { DialogService } from '../../shared/services/dialog/dialog.service';

@Component({
    selector: 'app-projects',
    imports: [
        MatTableModule,
        MatPaginatorModule,
        CommonModule,
        TableComponent,
        MatAutocompleteModule,
        MatOptionModule,
        SpeedDialComponent,
        FilterComponent,
    ],
    templateUrl: './projects.component.html',
    styleUrl: './projects.component.css',
})
export class ProjectsComponent implements OnInit {
    private readonly urlService = inject(UrlService);
    private readonly projectService = inject(ProjectService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly dateService = inject(DateService);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);
    private readonly dialogService = inject(DialogService);

    projects = signal<Project[]>([]);
    selectedRow = signal<Project | null>(null);

    // Table state
    pageSize = signal<number>(10);
    pageIndex = signal<number>(0);
    sortActive = signal<string>('');
    sortDirection = signal<SortDirection>('asc');

    filters = signal<ApiQueryParams>({});

    // Pagination metadata from server
    totalCount = signal<number>(0);
    isLoading = signal<boolean>(false);
    filteredProjects = signal<Project[]>([]);
    shownProjects = computed(() => new MatTableDataSource<Project>(this.filteredProjects()));
    displayedColumns = signal<DisplayedColumn<Project>[]>([
        {
            id: 'name',
            label: 'Name',
            sortable: true,
            value: (e: Project) => e.name,
            routerLink: (e: Project) => ['/project', e.key],
        },
        {
            id: 'owner',
            label: 'Owner',
            sortable: false,
            value: (e: Project) => e.owner?.username || 'N/A',
            routerLink: (e: Project) => (e.owner?.id ? ['/user', '@' + e.owner.username] : []),
        },
        {
            id: 'users',
            label: '# of users',
            sortable: true,
            value: (e: Project) => (e.members?.length || 0) + 1,
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            badge: (e: Project) => STATUS_COLOR_MAP[e.status],
            value: (e: Project) => STATUS_MAP[e.status],
        },
        {
            id: 'priority',
            label: 'Priority',
            sortable: true,
            badge: (e: Project) => PRIORITY_COLOR_MAP[e.priority],
            value: (e: Project) => PRIORITY_MAP[e.priority],
        },
        {
            id: 'createdAt',
            label: 'Created At',
            sortable: true,
            value: (e: Project) => {
                const date = this.dateService.parseTimestamp(e.createdAt);
                return this.dateService.toLocaleISOString(date).split('T')[0];
            },
        },
    ]);

    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selectedId = this.selectedRow();

        return [
            {
                iconName: 'add',
                label: 'Create Project',
                shown: selectedId === null,
                action: () => {
                    return ['new'];
                },
            },
            {
                iconName: 'delete',
                label: 'Delete Project',
                shown: selectedId !== null,
                onClick: () => {
                    this.openDeleteConfirmation();
                },
            },
            {
                iconName: 'archive',
                label: 'Archive Project',
                shown: selectedId !== null,
                onClick: () => {
                    this.openArchiveConfirmation();
                },
            },
            {
                iconName: 'edit',
                label: 'Edit Project',
                shown: selectedId !== null,
                action: () => {
                    const selectedProject = this.selectedRow();
                    if (!selectedProject) {
                        this.snackbarService.open('Please select a valid project to edit!');
                        return null;
                    }

                    return ['/project', selectedProject.key, 'edit'];
                },
            },
        ];
    });

    selectedProjectName = computed(() => {
        const selectedRow = this.selectedRow();
        if (!selectedRow) return '';
        const project = this.projects().find((p) => p.key === selectedRow.key);
        return project?.name || '';
    });

    initialFilterLoad = true;
    filterFields: Filter[] = [
        {
            name: 'name',
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
    ];

    // template reference variables
    speedDial = viewChild<SpeedDialComponent>('speedDial');
    deleteConfirmTemplate = viewChild<TemplateRef<any>>('deleteConfirmTemplate');
    archiveConfirmTemplate = viewChild<TemplateRef<any>>('archiveConfirmTemplate');
    speedDialNoButtonsLink = ['/projects/new'];

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
    }

    /**
     * Fetches projects from the server using current query params.
     * Updates the projects signal and pagination metadata.
     */
    getProjects() {
        this.isLoading.set(true);

        this.projectService
            .getProjects(this.buildQueryParams())
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

        this.onFilterChange(this.filters());
    }

    /**
     * Handles row selection changes from the custom table.
     * @param project The currently selected project. If null, it means the selection was cleared.
     */
    onRowChange(project: Project | null) {
        if (!project) {
            this.selectedRow.set(null);
            this.speedDial()?.close();
            return;
        }

        this.selectedRow.set(project);
        if (project.key && this.speedDial()?.isOpen()) return;

        this.speedDial()?.onTogglerClick();
    }

    /**
     * Handles filter changes emitted from the ProjectFilterComponent.
     * Updates the filters signal, resets pagination, updates URL and fetches new data.
     * @param filterParams
     */
    onFilterChange(filterParams: ApiQueryParams) {
        this.filters.set(filterParams);

        if (!this.initialFilterLoad) {
            this.pageIndex.set(0);
            this.urlService.removeQueryParams(['page']);
        }
        this.initialFilterLoad = false;

        this.setQueryParams();
        this.getProjects();
    }

    createProject() {
        this.router.navigate(['/projects/new']);
    }

    openDeleteConfirmation() {
        const template = this.deleteConfirmTemplate();
        if (!template) {
            this.snackbarService.open('Error opening confirmation dialog', ['snackbar-error']);
            return;
        }

        const dialogRef = this.dialogService.openConfirmDialog('Delete Project', template, {
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            width: '450px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.action === 'save') {
                this.deleteProject();
            }
        });
    }

    deleteProject() {
        const projectId = this.selectedRow();
        if (!projectId) {
            this.snackbarService.open('No project selected', ['snackbar-error']);
            return;
        }

        // TODO: Implement actual delete API call
        this.snackbarService.open(`Project "${this.selectedProjectName()}" deleted successfully!`);
        this.selectedRow.set(null);
        this.speedDial()?.close();
        // After successful deletion, refresh the projects list
        // this.getProjects();
    }

    openArchiveConfirmation() {
        const template = this.archiveConfirmTemplate();
        if (!template) {
            this.snackbarService.open('Error opening confirmation dialog', ['snackbar-error']);
            return;
        }

        const dialogRef = this.dialogService.openConfirmDialog('Archive Project', template, {
            confirmLabel: 'Archive',
            cancelLabel: 'Cancel',
            width: '450px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.action === 'save') {
                this.archiveProject();
            }
        });
    }

    archiveProject() {
        const projectId = this.selectedRow();
        if (!projectId) {
            this.snackbarService.open('No project selected', ['snackbar-error']);
            return;
        }

        // TODO: Implement actual archive API call
        this.snackbarService.open(`Project "${this.selectedProjectName()}" archived successfully!`);
        this.selectedRow.set(null);
        this.speedDial()?.close();
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
            // Add pagination
            page: this.pageIndex() > 0 ? this.pageIndex() : null,
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
