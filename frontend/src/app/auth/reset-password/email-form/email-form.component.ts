import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
    private readonly fb = inject(FormBuilder);

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
    });
    buttonText = input<string>('Resend verification email');
    sendForm = output<string>();

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
