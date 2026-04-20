import {
    Component,
    DestroyRef,
    effect,
    inject,
    input,
    output,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { DialogService } from '../../../../shared/services/dialog/dialog.service';
import { LabelService } from '../../../../shared/services/label/label.service';
import { Label } from '../../../../shared/model/Label';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-label-form-dialog',
    imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
    templateUrl: './label-form-dialog.component.html',
    styleUrl: './label-form-dialog.component.css',
})
export class LabelFormDialogComponent {
    private readonly dialogService = inject(DialogService);
    private readonly labelService = inject(LabelService);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly snackbarService = inject(SnackbarService);

    formTemplate = viewChild<TemplateRef<any>>('formTemplate');

    organizationId = input.required<string>();
    projectId = input.required<string>();
    label = input<Label | null>(null);
    labelSaved = output<Label>();
    labelEdited = output<Label>();
    canceled = output<void>();

    form = this.fb.group({
        name: ['', [Validators.required]],
        description: ['', [Validators.required, Validators.maxLength(64)]],
        color: [
            '',
            [Validators.required, Validators.pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)],
        ],
    });

    constructor() {
        effect(() => {
            const label = this.label();
            if (!label) {
                this.form.reset();
                return;
            }

            this.form.patchValue({
                name: label.name,
                description: label.description,
                color: label.color,
            });
        });
    }

    open() {
        const formTemplate = this.formTemplate();

        if (!formTemplate) {
            return;
        }

        const header = this.label() ? 'Edit Label' : 'Create Label';
        const dialogRef = this.dialogService.openFormDialog(header, formTemplate, {
            saveLabel: 'Save',
            width: '600px',
            saveDisabled: this.form.invalid,
            saveButtonClass: '',
        });

        this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            if (dialogRef.componentInstance) {
                dialogRef.componentInstance.data.saveDisabled = this.form.invalid;
            }
        });

        dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                if (result && result.action === 'save') {
                    const label = this.label();
                    if (label) {
                        this.edit();
                    } else {
                        this.create();
                    }
                } else {
                    this.canceled.emit();
                }
                this.form.reset();
            });
    }

    private create() {
        const { name, description, color } = this.form.value;

        if (!name || !color || !description) {
            this.form.markAllAsTouched();
            return;
        }

        this.labelService
            .createLabel({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
                label: {
                    name: name,
                    description: description,
                    color: color,
                },
            })
            .subscribe({
                next: (label) => {
                    this.snackbarService.success('Label created successfully!');
                    this.labelSaved.emit(label);
                },
                error: (err) => {
                    this.snackbarService.error('Failed to create label!');
                    console.error('Error creating label:', err);
                },
            });
    }

    private edit() {
        const label = this.label();
        const { name, description, color } = this.form.value;

        if (!label) {
            return;
        }

        if (!name || !color || !description) {
            this.form.markAllAsTouched();
            return;
        }

        const updatedLabel: Omit<Label, 'id'> = {
            projectId: label.projectId,
            name,
            description,
            color,
        };

        this.labelService
            .updateLabel({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
                labelId: label.id,
                label: updatedLabel,
            })
            .subscribe({
                next: (label) => {
                    this.snackbarService.success('Label updated successfully!');
                    this.labelEdited.emit(label);
                },
                error: (err) => {
                    this.snackbarService.error('Failed to update label!');
                    console.error('Error updating label:', err);
                },
            });
    }

    get name() {
        return this.form.get('name')!;
    }

    get description() {
        return this.form.get('description')!;
    }

    get color() {
        return this.form.get('color')!;
    }
}
