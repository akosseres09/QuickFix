import { inject, Injectable, TemplateRef } from '@angular/core';
import { DialogComponent, DialogData } from '../../../common/dialog/dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

/**
 * Example service demonstrating how to use the reusable dialog component
 *
 * Usage in your component:
 *
 * 1. Import MatDialog and DialogComponent:
 *    import { MatDialog } from '@angular/material/dialog';
 *    import { DialogComponent } from './common/dialog/dialog.component';
 *
 * 2. Create a template reference in your component HTML:
 *    <ng-template #myFormTemplate>
 *      <form [formGroup]="myForm">
 *        <div class="flex flex-col gap-4">
 *          <mat-form-field class="w-full">
 *            <mat-label>Name</mat-label>
 *            <input matInput formControlName="name" />
 *          </mat-form-field>
 *          <mat-form-field class="w-full">
 *            <mat-label>Email</mat-label>
 *            <input matInput type="email" formControlName="email" />
 *          </mat-form-field>
 *        </div>
 *      </form>
 *    </ng-template>
 *
 * 3. Reference it in your TypeScript component:
 *    @ViewChild('myFormTemplate') myFormTemplate!: TemplateRef<any>;
 *
 * 4. Open the dialog:
 *    openDialog() {
 *      const dialogRef = this.dialog.open(DialogComponent, {
 *        width: '500px',
 *        data: {
 *          title: 'Add New User',
 *          content: this.myFormTemplate,
 *          saveLabel: 'Create',
 *          cancelLabel: 'Cancel',
 *          saveDisabled: this.myForm.invalid
 *        }
 *      });
 *
 *      dialogRef.afterClosed().subscribe(result => {
 *        if (result && result.action === 'save') {
 *          // Handle save action
 *          console.log('Saving form:', this.myForm.value);
 *        }
 *      });
 *    }
 *
 * Additional Options:
 * - showSaveButton: false to hide the save button
 * - showCancelButton: false to hide the cancel button
 * - saveDisabled: true to disable the save button (useful for form validation)
 */
@Injectable({
    providedIn: 'root',
})
export class DialogService {
    private dialog = inject(MatDialog);
    /**
     * Opens a dialog with form content
     * @param title Dialog title
     * @param content Template reference containing the form
     * @param options Additional dialog options
     * @returns Observable of the dialog result
     */
    openFormDialog(
        title: string,
        content: TemplateRef<any>,
        options?: {
            saveLabel?: string;
            cancelLabel?: string;
            width?: string;
            saveDisabled?: boolean;
            showSaveButton?: boolean;
            showCancelButton?: boolean;
        }
    ): MatDialogRef<DialogComponent> {
        return this.dialog.open(DialogComponent, {
            width: options?.width || '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            disableClose: false,
            data: {
                title,
                content,
                saveLabel: options?.saveLabel || 'Save',
                cancelLabel: options?.cancelLabel || 'Cancel',
                saveDisabled: options?.saveDisabled || false,
                showSaveButton: options?.showSaveButton !== false,
                showCancelButton: options?.showCancelButton !== false,
            } as DialogData,
        });
    }

    /**
     * Opens a confirmation dialog
     * @param title Dialog title
     * @param content Template reference containing the confirmation message
     * @returns Observable of the dialog result
     */
    openConfirmDialog(
        title: string,
        content: TemplateRef<any>,
        options?: {
            confirmLabel?: string;
            cancelLabel?: string;
            width?: string;
        }
    ): MatDialogRef<DialogComponent> {
        return this.dialog.open(DialogComponent, {
            width: options?.width || '400px',
            maxWidth: '90vw',
            data: {
                title,
                content,
                saveLabel: options?.confirmLabel || 'Confirm',
                cancelLabel: options?.cancelLabel || 'Cancel',
                showSaveButton: true,
                showCancelButton: true,
            } as DialogData,
        });
    }
}
