import { Component, Inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';

export interface DialogData {
    title: string;
    content: TemplateRef<any>;
    saveLabel?: string;
    cancelLabel?: string;
    showSaveButton?: boolean;
    showCancelButton?: boolean;
    saveDisabled?: boolean;
    width?: string;
    saveButtonClass?: string;
    cancelButtonClass?: string;
}

@Component({
    selector: 'app-dialog',
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatDivider],
    templateUrl: './dialog.component.html',
    styleUrl: './dialog.component.css',
})
export class DialogComponent {
    constructor(
        public dialogRef: MatDialogRef<DialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
        this.data.saveLabel = this.data.saveLabel || 'Save';
        this.data.cancelLabel = this.data.cancelLabel || 'Cancel';
        this.data.showSaveButton = this.data.showSaveButton !== false;
        this.data.showCancelButton = this.data.showCancelButton !== false;
        this.data.saveDisabled = this.data.saveDisabled || false;
        this.data.saveButtonClass =
            this.data.saveButtonClass !== undefined
                ? this.data.saveButtonClass + ' !text-white'
                : '!bg-red-300 !text-red-700';
        this.data.cancelButtonClass = this.data.cancelButtonClass;
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }

    onSave(): void {
        this.dialogRef.close({ action: 'save' });
    }
}
