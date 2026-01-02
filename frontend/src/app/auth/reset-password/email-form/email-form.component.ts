import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';

@Component({
    selector: 'app-email-form',
    imports: [
        MatFormField,
        MatInput,
        MatLabel,
        MatPrefix,
        MatError,
        MatIcon,
        MatButton,
        ReactiveFormsModule,
        CommonModule,
    ],
    templateUrl: './email-form.component.html',
    styleUrl: './email-form.component.css',
})
export class EmailFormComponent {
    form: FormGroup;
    buttonText = input<string>('Resend verification email');
    sendForm = output<string>();

    constructor() {
        this.form = new FormGroup({
            email: new FormControl('', [Validators.required, Validators.email]),
        });
    }

    getControl(name: string) {
        return this.form.get(name);
    }

    onSubmit() {
        if (!this.form.valid) return;

        const email = this.getControl('email')?.value;

        if (!email) return;

        this.sendForm.emit(email);
    }
}
