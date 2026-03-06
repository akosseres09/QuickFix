import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { LabelService } from '../../../shared/services/label.service';
import { Label } from '../../../shared/model/Label';
import { TableComponent } from '../../../common/table/table.component';
import { DisplayedColumnService } from '../../../shared/services/displayed-column/displayed-column.service';
import { SpeedDialButtonFactory } from '../../../shared/services/speed-dial/speed-dial-button.factory';
import { SpeedDialButton } from '../../../shared/constants/speed-dial/SpeedDialButton';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { FilterService } from '../../../shared/services/filter/filter.service';
import { FilterComponent } from '../../../common/filter/filter.component';
import { ApiQueryParams } from '../../../shared/constants/api/ApiQueryParams';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { ListStateService } from '../../../shared/services/list-state/list-state.service';
import { ListState } from '../../../shared/constants/table/ListState';
import { ActivatedRoute } from '@angular/router';
import { SpeedDialComponent } from '../../../common/speed-dial/speed-dial.component';
import { finalize } from 'rxjs/internal/operators/finalize';

@Component({
    selector: 'app-labels',
    imports: [TableComponent, FilterComponent, SpeedDialComponent],
    templateUrl: './labels.component.html',
    styleUrl: './labels.component.css',
})
export class LabelsComponent {
    private readonly labelService = inject(LabelService);
    private readonly displayedColumnService = inject(DisplayedColumnService);
    private readonly buttonFactory = inject(SpeedDialButtonFactory);
    private readonly snackbarService = inject(SnackbarService);
    private readonly filterService = inject(FilterService);
    private readonly listStateService = inject(ListStateService);
    private readonly activeRoute = inject(ActivatedRoute);

    readonly listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 20,
    });

    projectId = input.required<string>();
    organizationId = input.required<string>();

    labels = signal<Label[]>([]);
    filteredLabels = signal<Label[]>(this.labels());
    shownLabels = computed(() => new MatTableDataSource<Label>(this.filteredLabels()));

    selectedRow = signal<Label | null>(null);

    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selected = this.selectedRow();
        const currentProjectId = this.projectId();

        return this.buttonFactory.createBaseCrudButtons({
            entityName: 'Label',
            hasSelection: selected !== null,
            createRoute: ['add'],
            editRouteBuilder: () => {
                const labelId = this.selectedRow()?.id;
                if (!labelId) {
                    this.snackbarService.open('Please select a valid label to edit!');
                    return null;
                }
                return ['/project', currentProjectId, 'label', labelId, 'edit'];
            },
            onDelete: () => {},
        });
    });

    displayedColumns = this.displayedColumnService.getLabelColumns();
    filteredFields = this.filterService.getLabelFilters();

    speedDial = viewChild<SpeedDialComponent>('speedDial');

    getLabels() {
        if (!this.projectId()) {
            return;
        }

        this.listState.isLoading.set(true);

        this.labelService
            .getLabelsToProject({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
                queryParams: this.listState.buildQueryParams(),
            })
            .pipe(finalize(() => this.listState.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.labels.set(response.items);
                    this.filteredLabels.set(response.items);
                    this.listState.totalCount.set(response._meta.totalCount);
                },
                error: (error) => {
                    console.error(error);
                    this.snackbarService.error('Failed to load labels!');
                },
            });
    }

    onSortChange(event: Sort) {
        this.listState.onSortChange(event, () => this.getLabels());
    }

    onPageChange(event: PageEvent) {
        this.listState.onPageChange(event, () => this.getLabels());
    }

    onRowChange(label: Label | null) {
        this.selectedRow.set(label);

        if (!label) {
            this.speedDial()?.close();
            return;
        }

        if (this.speedDial()?.isOpen()) return;

        this.speedDial()?.onTogglerClick();
    }

    onFilterChange(params: ApiQueryParams) {
        this.listState.onFilterChange(params, () => this.getLabels());
    }
}
