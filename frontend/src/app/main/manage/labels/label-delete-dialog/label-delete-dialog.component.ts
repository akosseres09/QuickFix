import {
    Component,
    DestroyRef,
    inject,
    input,
    output,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { LabelService } from '../../../../shared/services/label/label.service';
import { DialogService } from '../../../../shared/services/dialog/dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-label-delete-dialog',
    imports: [],
    templateUrl: './label-delete-dialog.component.html',
    styleUrl: './label-delete-dialog.component.css',
})
export class LabelDeleteDialogComponent {
    private readonly labelService = inject(LabelService);
    private readonly dialogService = inject(DialogService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly snackbarService = inject(SnackbarService);

    organizationId = input.required<string>();
    projectId = input.required<string>();
    labelId = input.required<string | null>();

    deleted = output<string>();
    canceled = output<void>();

    templateRef = viewChild<TemplateRef<any>>('deleteConfirmTemplate');
    open() {
        const template = this.templateRef();
        const labelId = this.labelId();
        if (!template || !labelId) {
            console.error('Delete confirmation template or label ID not found!');
            return;
        }

        const dialogRef = this.dialogService.openConfirmDialog('Delete Label?', template, {
            confirmLabel: 'Delete',
            width: '400px',
        });

        dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed) => {
                if (confirmed) {
                    this.deleteLabel(labelId);
                }
                this.canceled.emit();
            });
    }

    private deleteLabel(labelId: string) {
        this.labelService
            .deleteLabel({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
                labelId,
            })
            .subscribe({
                next: () => {
                    this.snackbarService.success('Label deleted successfully!');
                    this.deleted.emit(labelId);
                },
                error: (err) => {
                    this.snackbarService.error(err.error.message || 'Failed to delete label.');
                    console.error('Error deleting label:', err);
                },
            });
    }
}
