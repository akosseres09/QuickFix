import { CommonModule } from '@angular/common';
import {
    Component,
    computed,
    DestroyRef,
    inject,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableComponent } from '../../common/table/table.component';
import { Project } from '../../shared/model/Project';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { ProjectService } from '../../shared/services/project/project.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Sort } from '@angular/material/sort';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { SpeedDialButton } from '../../shared/constants/SpeedDialButton';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { Filter } from '../../shared/constants/Filter';
import { FilterComponent } from '../../common/filter/filter.component';
import { FilterService } from '../../shared/services/filter/filter.service';
import { DisplayedColumnService } from '../../shared/services/displayed-column/displayed-column.service';
import { SpeedDialButtonFactory } from '../../shared/services/speed-dial/speed-dial-button.factory';
import { ListStateService } from '../../shared/services/list-state/list-state.service';
import { ListState } from '../../shared/constants/table/ListState';
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
export class ProjectsComponent {
    private readonly projectService = inject(ProjectService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly snackbarService = inject(SnackbarService);
    private readonly filterService = inject(FilterService);
    private readonly displayedColumnService = inject(DisplayedColumnService);
    private readonly listStateService = inject(ListStateService);
    private readonly buttonFactory = inject(SpeedDialButtonFactory);
    private dialogService = inject(DialogService);

    // List state (pagination, sorting, filtering)
    readonly listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 10,
        expand: 'owner,members',
    });

    projects = signal<Project[]>([]);
    selectedRow = signal<Project | null>(null);
    filteredProjects = signal<Project[]>([]);
    shownProjects = computed(() => new MatTableDataSource<Project>(this.filteredProjects()));
    displayedColumns = signal<DisplayedColumn<Project>[]>(
        this.displayedColumnService.getProjectColumns()
    );

    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selected = this.selectedRow();
        return this.buttonFactory.createCrudButtons({
            entityName: 'Project',
            hasSelection: selected !== null,
            createRoute: ['new'],
            editRouteBuilder: () => {
                const project = this.selectedRow();
                if (!project) {
                    this.snackbarService.open('Please select a valid project to edit!');
                    return null;
                }
                return ['/project', project.key, 'edit'];
            },
            onDelete: () => this.openDeleteConfirmation(),
            onArchive: () => this.openArchiveConfirmation(),
        });
    });

    selectedProjectName = computed(() => {
        const selectedRow = this.selectedRow();
        if (!selectedRow) return '';
        const project = this.projects().find((p) => p.key === selectedRow.key);
        return project?.name || '';
    });

    filterFields: Filter[] = this.filterService.getProjectFilters();

    // template reference variables
    speedDial = viewChild<SpeedDialComponent>('speedDial');
    deleteConfirmTemplate = viewChild<TemplateRef<any>>('deleteConfirmTemplate');
    archiveConfirmTemplate = viewChild<TemplateRef<any>>('archiveConfirmTemplate');
    speedDialNoButtonsLink = ['/projects/new'];

    /**
     * Fetches projects from the server using current query params.
     * Updates the projects signal and pagination metadata.
     */
    getProjects() {
        this.listState.isLoading.set(true);

        this.projectService
            .getProjects(this.listState.buildQueryParams())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.projects.set(response.items);
                this.filteredProjects.set(response.items);
                this.listState.totalCount.set(response._meta.totalCount);
                this.listState.isLoading.set(false);
            });
    }

    /**
     * Handles sort change events from the table, updates the URL and fetches new data.
     */
    onSortChange(event: Sort) {
        this.listState.onSortChange(event, () => this.getProjects());
    }

    /**
     * Handles page change events from the paginator, updates the URL and fetches new data.
     */
    onPageChange(event: PageEvent) {
        this.listState.onPageChange(event, () => this.getProjects());
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
     */
    onFilterChange(filterParams: ApiQueryParams) {
        this.listState.onFilterChange(filterParams, () => this.getProjects());
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
}
