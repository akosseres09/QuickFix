import {
    Component,
    DestroyRef,
    inject,
    input,
    output,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { WorktimeService } from '../../../shared/services/worktime/worktime.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { Worktime } from '../../../shared/model/Worktime';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-delete-worktime-dialog',
    imports: [],
    templateUrl: './delete-worktime-dialog.component.html',
    styleUrl: './delete-worktime-dialog.component.css',
})
export class DeleteWorktimeDialogComponent {
    private readonly worktimeService = inject(WorktimeService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly dialogService = inject(DialogService);
    private readonly destroyRef = inject(DestroyRef);

    organizationId = input.required<string>();
    worktime = input.required<Worktime | null>();

    worktimeDeleted = output<string>();
    canceled = output<void>();

    template = viewChild<TemplateRef<any>>('deleteConfirmTemplate');

    open() {
        const template = this.template();
        const orgId = this.organizationId();
        const worktime = this.worktime();

        if (!template || !orgId || !worktime) return;

        const dialogRef = this.dialogService.openFormDialog('Delete Worktime', template, {
            saveLabel: 'Delete',
            width: '600px',
        });

        dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                if (result?.action === 'save') {
                    this.onDelete(orgId, worktime.id);
                } else {
                    this.canceled.emit();
                }
            });
    }

    onDelete(organizationId: string, worktimeId: string) {
        this.worktimeService.deleteWorktime(organizationId, worktimeId).subscribe({
            next: () => {
                this.worktimeDeleted.emit(worktimeId);
                this.snackbarService.success('Worktime deleted!');
            },
            error: (error) => {
                console.error(error);
                this.snackbarService.error(error.error.message ?? 'Failed to delete worktime!');
            },
        });
    }
}
