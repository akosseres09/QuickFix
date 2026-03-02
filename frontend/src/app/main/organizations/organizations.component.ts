import { Component, computed, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { FilterComponent } from '../../common/filter/filter.component';
import { TableComponent } from '../../common/table/table.component';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { ActivatedRoute } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { FilterService } from '../../shared/services/filter/filter.service';
import { DisplayedColumnService } from '../../shared/services/displayed-column/displayed-column.service';
import { ListStateService } from '../../shared/services/list-state/list-state.service';
import { SpeedDialButtonFactory } from '../../shared/services/speed-dial/speed-dial-button.factory';
import { DialogService } from '../../shared/services/dialog/dialog.service';
import { ListState } from '../../shared/constants/table/ListState';
import { Organization } from '../../shared/model/Organization';
import { MatTableDataSource } from '@angular/material/table';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { SpeedDialButton } from '../../shared/constants/speed-dial/SpeedDialButton';
import { Filter } from '../../shared/constants/Filter';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { OrganizationService } from '../../shared/services/organization/organization.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-organizations',
    imports: [FilterComponent, TableComponent, SpeedDialComponent],
    templateUrl: './organizations.component.html',
    styleUrl: './organizations.component.css',
})
export class OrganizationsComponent {
    private readonly organizationService = inject(OrganizationService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly snackbarService = inject(SnackbarService);
    private readonly filterService = inject(FilterService);
    private readonly displayedColumnService = inject(DisplayedColumnService);
    private readonly listStateService = inject(ListStateService);
    private readonly buttonFactory = inject(SpeedDialButtonFactory);
    private dialogService = inject(DialogService);

    // List state (pagination, sorting, filtering)
    readonly listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 20,
        expand: 'owner',
    });

    selectedRow = signal<Organization | null>(null);
    filteredOrganizations = signal<Organization[]>([]);
    shownProjects = computed(
        () => new MatTableDataSource<Organization>(this.filteredOrganizations())
    );
    displayedColumns = signal<DisplayedColumn<Organization>[]>(
        this.displayedColumnService.getOrganizationColumns()
    );

    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selected = this.selectedRow();
        return this.buttonFactory.createBaseCrudButtons({
            entityName: 'Organization',
            hasSelection: selected !== null,
            createRoute: ['new'],
            editRouteBuilder: () => {
                const org = this.selectedRow();
                if (!org) {
                    this.snackbarService.error('Please select a valid project to edit!');
                    return null;
                }
                return ['/organization', org.slug, 'edit'];
            },
            onDelete: () =>
                this.openConfirmationDialog({
                    header: 'Delete Organization',
                    confirmLabel: 'Delete',
                    confirmAction: () => this.deleteOrganization(),
                }),
        });
    });

    selectedOrgName = computed(() => {
        const selectedRow = this.selectedRow();
        if (!selectedRow) return '';
        const org = this.filteredOrganizations().find((p) => p.slug === selectedRow.slug);
        return org?.name || '';
    });

    filterFields: Filter[] = this.filterService.getOrganizationFilters();

    speedDial = viewChild<SpeedDialComponent>('speedDial');
    deleteConfirmTemplate = viewChild<TemplateRef<any>>('deleteConfirmTemplate');

    getOrganizations() {
        this.listState.isLoading.set(true);

        this.organizationService
            .getOrganizations(this.listState.buildQueryParams())
            .pipe(finalize(() => this.listState.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.filteredOrganizations.set(response.items);
                },
                error: (error) => {
                    console.error(error);
                    this.snackbarService.error('Failed to load organizations!');
                },
            });
    }

    /**
     * Handles sort change events from the table, updates the URL and fetches new data.
     */
    onSortChange(event: Sort) {
        this.listState.onSortChange(event, () => this.getOrganizations());
    }

    /**
     * Handles page change events from the paginator, updates the URL and fetches new data.
     */
    onPageChange(event: PageEvent) {
        this.listState.onPageChange(event, () => this.getOrganizations());
    }

    /**
     * Handles row selection changes from the custom table.
     * @param project The currently selected project. If null, it means the selection was cleared.
     */
    onRowChange(project: Organization | null) {
        if (!project) {
            this.selectedRow.set(null);
            this.speedDial()?.close();
            return;
        }

        this.selectedRow.set(project);
        if (project.slug && this.speedDial()?.isOpen()) return;

        this.speedDial()?.onTogglerClick();
    }

    /**
     * Handles filter changes emitted from the ProjectFilterComponent.
     */
    onFilterChange(filterParams: ApiQueryParams) {
        this.listState.onFilterChange(filterParams, () => this.getOrganizations());
    }

    private openConfirmationDialog(config: {
        header: string;
        confirmLabel: string;
        confirmAction: () => void;
    }) {
        const template = this.deleteConfirmTemplate();
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

    private deleteOrganization() {
        const org = this.selectedRow();
        if (!org) return;

        this.organizationService.delete(org.slug).subscribe({
            next: () => {
                this.snackbarService.success('Organization deleted!');
                this.getOrganizations();
            },
            error: (error) => {
                console.error(error);
                this.snackbarService.error('Failed to delete organization!');
            },
        });
    }
}
