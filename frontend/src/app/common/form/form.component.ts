import {
    Component,
    EventEmitter,
    inject,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
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
export class FormComponent implements OnInit, OnChanges {
    @Input({ required: true }) fields: Array<FormField> = [];
    @Output() save: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

    form!: FormGroup;
    formBuilder = inject(FormBuilder);

    constructor() {
        this.setForm();
    }

    ngOnInit(): void {}

    ngOnChanges(changes: SimpleChanges): void {
        this.fields = changes['fields'].currentValue;
        this.setForm();
    }

    setForm() {
        const group: any = {};
        this.fields.forEach((field) => {
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
