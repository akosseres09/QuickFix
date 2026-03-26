import { CommonModule } from '@angular/common';
import {
    Component,
    computed,
    inject,
    input,
    linkedSignal,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableComponent } from '../../common/table/table.component';
import { Project } from '../../shared/model/Project';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { ProjectService } from '../../shared/services/project/project.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { Sort } from '@angular/material/sort';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { SpeedDialButton } from '../../shared/constants/speed-dial/SpeedDialButton';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { Filter } from '../../shared/constants/Filter';
import { FilterComponent } from '../../common/filter/filter.component';
import { FilterService } from '../../shared/services/filter/filter.service';
import { DisplayedColumnService } from '../../shared/services/displayed-column/displayed-column.service';
import { SpeedDialButtonFactory } from '../../shared/services/speed-dial/speed-dial-button.factory';
import { ListStateService } from '../../shared/services/list-state/list-state.service';
import { ListState } from '../../shared/constants/table/ListState';
import { DialogService } from '../../shared/services/dialog/dialog.service';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ProjectPermissions } from '../../shared/constants/user/Permissions';

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
    private readonly snackbarService = inject(SnackbarService);
    private readonly filterService = inject(FilterService);
    private readonly displayedColumnService = inject(DisplayedColumnService);
    private readonly listStateService = inject(ListStateService);
    private readonly authService = inject(AuthService);
    private readonly buttonFactory = inject(SpeedDialButtonFactory);
    private dialogService = inject(DialogService);

    organizationId = input.required<string>();
    currentUser = this.authService.currentClaimsWithPermissions;

    // List state (pagination, sorting, filtering)
    readonly listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 10,
        expand: 'owner,members',
    });

    projects = signal<Project[]>([]);
    selectedRow = signal<Project | null>(null);
    filteredProjects = signal<Project[]>([]);
    shownProjects = computed(() => new MatTableDataSource<Project>(this.filteredProjects()));
    displayedColumns = linkedSignal<DisplayedColumn<Project>[]>(() =>
        this.displayedColumnService.getProjectColumns()
    );

    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selected = this.selectedRow();
        const user = this.currentUser();

        if (!user) return [];

        const ctx = { orgId: this.organizationId(), projectId: selected?.key };

        const buttons: SpeedDialButton[] = [
            {
                shown: !selected && user.canDo(ProjectPermissions.CREATE, ctx),
                iconName: 'add',
                label: 'New Project',
                action: () => ['new'],
            },
            {
                shown: !!selected && user.canDo(ProjectPermissions.UPDATE, ctx),
                iconName: 'edit',
                label: 'Edit Project',
                action: () => (selected ? ['/projects', selected.key, 'edit'] : []),
            },
            {
                shown: !!selected && user.canDo(ProjectPermissions.DELETE, ctx),
                iconName: 'delete',
                label: 'Delete Project',
                onClick: () =>
                    this.openConfirmationDialog({
                        header: 'Delete Project',
                        confirmLabel: 'Delete',
                        confirmAction: () => this.deleteProject(),
                        template: this.deleteConfirmTemplate(),
                    }),
            },
            {
                shown: !!selected && user.canDo(ProjectPermissions.UPDATE, ctx),
                iconName: selected?.isArchived ? 'unarchive' : 'archive',
                label: selected?.isArchived ? 'Unarchive Project' : 'Archive Project',
                onClick: () =>
                    this.openConfirmationDialog({
                        header: selected?.isArchived ? 'Unarchive Project' : 'Archive Project',
                        confirmLabel: selected?.isArchived ? 'Unarchive' : 'Archive',
                        confirmAction: () => {
                            const selected = this.selectedRow();
                            if (!selected) {
                                this.snackbarService.error('No project selected');
                                return;
                            }

                            this.updateProject({
                                isArchived: !selected.isArchived,
                            });
                        },
                        template: this.archiveConfirmTemplate(),
                    }),
            },
        ];

        return buttons;
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
        const orgId = this.organizationId();
        if (!this.organizationId) return;

        this.listState.isLoading.set(true);

        this.projectService
            .getProjects(orgId, this.listState.buildQueryParams())
            .pipe(finalize(() => this.listState.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.projects.set(response.items);
                    this.filteredProjects.set(response.items);
                    this.listState.totalCount.set(response._meta.totalCount);
                },
                error: (error) => {
                    console.error('Error fetching projects', error);
                    this.snackbarService.error('Error fetching projects');
                },
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

    openConfirmationDialog(config: {
        header: string;
        confirmLabel: string;
        confirmAction: () => void;
        template?: TemplateRef<any>;
    }) {
        const template = config.template;
        if (!template) {
            this.snackbarService.error('Error opening confirmation dialog');
            return;
        }

        const dialogRef = this.dialogService.openConfirmDialog(config.header, template, {
            confirmLabel: config.confirmLabel,
            cancelLabel: 'Cancel',
            width: '450px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.action === 'save') {
                config.confirmAction();
            }
        });
    }

    deleteProject() {
        const project = this.selectedRow();
        if (!project) {
            this.snackbarService.error('No project selected');
            return;
        }

        const orgId = this.organizationId();
        if (!orgId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.projectService.deleteProject(orgId, project.key).subscribe({
            next: () => {
                this.snackbarService.success(
                    `Project "${this.selectedProjectName()}" deleted successfully!`
                );
                this.selectedRow.set(null);
                this.speedDial()?.close();
                this.getProjects();
            },
            error: (error) => {
                console.error('Error deleting project', error);
                this.snackbarService.error('Error deleting project');
            },
        });
    }

    updateProject(data: Partial<Project>) {
        const project = this.selectedRow();
        if (!project) {
            this.snackbarService.error('No project selected');
            return;
        }

        const orgId = this.organizationId();
        if (!orgId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.projectService.updateProject(orgId, project.key, data).subscribe({
            next: () => {
                this.selectedRow.set(null);
                this.speedDial()?.close();
                this.getProjects();
                this.snackbarService.success(
                    `Project "${this.selectedProjectName()}" archived successfully!`
                );
            },
            error: (error) => {
                console.error(error);
            },
        });
    }
}
