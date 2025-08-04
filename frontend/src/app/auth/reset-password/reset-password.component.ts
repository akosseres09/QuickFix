import { Component } from '@angular/core';
import { EmailFormComponent } from '../../common/email-form/email-form.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-reset-password',
    imports: [
        EmailFormComponent,
        MatInput,
        MatLabel,
        MatFormField,
        ReactiveFormsModule,
        CommonModule,
        MatError,
        MatIcon,
        MatPrefix,
        MatButton,
    ],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
    form: FormGroup;
    emailSent: boolean = false;

    constructor() {
        this.form = new FormGroup({
            token: new FormControl('', [Validators.required]),
            password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        });
    }

    resend(email: string): void {
        if (!email) return;

        this.emailSent = true;
    }

    onSubmit(): void {}

    getControl(name: string) {
        return this.form.get(name);
    }
}
