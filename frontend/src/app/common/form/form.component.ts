import { Component, effect, inject, input, output } from '@angular/core';
import { FormField } from '../../shared/constants/FormField';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormField,
        MatInput,
        MatButton,
        MatLabel,
        MatError,
    ],
    templateUrl: './form.component.html',
    styleUrl: './form.component.css',
})
export class FormComponent {
    fields = input.required<Array<FormField>>();
    save = output<any>();
    cancel = output<void>();

    form!: FormGroup;
    formBuilder = inject(FormBuilder);

    constructor() {
        effect(() => {
            this.setForm();
        });
    }

    setForm() {
        const group: any = {};
        this.fields().forEach((field) => {
            group[field.name] = [field.value || '', field.validators || []];
        });
        this.form = this.formBuilder.group(group);
    }

    getControl(name: string) {
        return this.form.get(name);
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.save.emit(this.form.value);
    }

    onCancel() {
        this.cancel.emit();
    }
}
