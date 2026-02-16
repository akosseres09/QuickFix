import { Component, inject, Signal, TemplateRef, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { ProjectFormComponent } from '../../../common/form/project-form/project-form.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-new',
    imports: [CommonModule, MatIconModule, RouterLink, ProjectFormComponent],
    templateUrl: './new.component.html',
    styleUrl: './new.component.css',
})
export class NewComponent {
    private readonly dialogService = inject(DialogService);

    infoDialogRef: Signal<TemplateRef<any> | undefined> = viewChild('infoDialog');

    openInfo(): void {
        const dialogRef = this.infoDialogRef();
        if (!dialogRef) return;
        this.dialogService.openConfirmDialog('Project Information', dialogRef, {
            width: '600px',
        });
    }
}
