import { Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { LabelService } from '../../../shared/services/label.service';
import { FixStatusNames, Label } from '../../../shared/model/Label';
import { TableComponent } from '../../../common/table/table.component';
import { DisplayedColumnService } from '../../../shared/services/displayed-column/displayed-column.service';
import { SpeedDialButton } from '../../../shared/constants/speed-dial/SpeedDialButton';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { ListStateService } from '../../../shared/services/list-state/list-state.service';
import { ListState } from '../../../shared/constants/table/ListState';
import { ActivatedRoute } from '@angular/router';
import { SpeedDialComponent } from '../../../common/speed-dial/speed-dial.component';
import { finalize } from 'rxjs/internal/operators/finalize';
import { LabelFormDialogComponent } from './label-form-dialog/label-form-dialog.component';
import { LabelDeleteDialogComponent } from './label-delete-dialog/label-delete-dialog.component';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ProjectPermissions } from '../../../shared/constants/user/Permissions';

@Component({
    selector: 'app-labels',
    imports: [
        TableComponent,
        SpeedDialComponent,
        LabelFormDialogComponent,
        LabelDeleteDialogComponent,
    ],
    templateUrl: './labels.component.html',
    styleUrl: './labels.component.css',
})
export class LabelsComponent implements OnInit {
    private readonly labelService = inject(LabelService);
    private readonly displayedColumnService = inject(DisplayedColumnService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly listStateService = inject(ListStateService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);

    private readonly currentUser = this.authService.currentClaimsWithPermissions;

    readonly listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 20,
    });

    projectId = input.required<string>();
    organizationId = input.required<string>();

    labels = signal<Label[]>([]);
    shownLabels = computed(() => new MatTableDataSource<Label>(this.labels()));
    selectedRow = signal<Label | null>(null);

    fixStatusNames = FixStatusNames;

    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selected = this.selectedRow();
        const user = this.currentUser();
        if (!user) return [];

        const ctx = { projectId: this.projectId(), orgId: this.organizationId() };
        const canUpdate = user.canDo(ProjectPermissions.UPDATE, ctx);

        return [
            {
                iconName: 'add',
                label: `Create Label`,
                shown: selected === null && canUpdate,
                onClick: () => this.openLabelFormDialog(),
            },
            {
                iconName: 'edit',
                label: `Edit Label`,
                shown: selected !== null && canUpdate,
                onClick: () => {
                    if (!selected) {
                        this.snackbarService.open('Please select a valid label to edit!');
                        return;
                    }

                    this.openLabelFormDialog();
                },
            },
            {
                iconName: 'delete',
                label: `Delete Label`,
                shown: selected !== null && canUpdate,
                onClick: () => {
                    if (!selected) {
                        this.snackbarService.open('Please select a valid label to delete!');
                        return;
                    }

                    this.openLabelDeleteDialog();
                },
            },
        ];
    });

    ngOnInit(): void {
        this.getLabels();
    }

    displayedColumns = this.displayedColumnService.getLabelColumns();

    speedDial = viewChild<SpeedDialComponent>('speedDial');
    labelFormDialog = viewChild(LabelFormDialogComponent);
    labelDeleteDialog = viewChild(LabelDeleteDialogComponent);

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

    isRowDisabled = (row: Label): boolean => {
        return row.name === this.fixStatusNames.CLOSED || row.name === this.fixStatusNames.OPEN;
    };

    onRowChange(label: Label | null) {
        this.selectedRow.set(label);

        if (!label) {
            this.speedDial()?.close();
            return;
        }

        if (this.speedDial()?.isOpen()) return;

        this.speedDial()?.onTogglerClick();
    }

    onDialogCanceled() {
        this.onRowChange(null);
    }

    onLabelSaved(label: Label) {
        this.labels.update((labels) => {
            const index = labels.findIndex((l) => l.id === label.id);

            if (index !== -1) {
                return labels.map((l, i) => (i === index ? label : l));
            } else {
                return [...labels, label];
            }
        });
    }

    onLabelDeleted(labelId: string) {
        this.labels.update((labels) => labels.filter((l) => l.id !== labelId));
    }

    private openLabelFormDialog() {
        this.labelFormDialog()?.open();
    }

    private openLabelDeleteDialog() {
        this.labelDeleteDialog()?.open();
    }
}
