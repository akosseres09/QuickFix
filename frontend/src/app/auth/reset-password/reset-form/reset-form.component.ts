import { Component, inject, input } from '@angular/core';
import {
    AbstractControlOptions,
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { passwordMatchValidator } from '../../../shared/validators/passwordValidator/passwordValidator';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-reset-form',
    imports: [
        ReactiveFormsModule,
        CommonModule,
        MatInput,
        MatFormField,
        MatLabel,
        MatIcon,
        MatError,
        MatButton,
        MatPrefix,
    ],
    templateUrl: './reset-form.component.html',
    styleUrl: './reset-form.component.css',
})
export class ResetFormComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private snackBar = inject(SnackbarService);
    token = input<string>('');
    form = this.fb.group(
        {
            token: [this.token(), [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rePassword: ['', [Validators.required, Validators.minLength(6)]],
        },
        {
            validators: passwordMatchValidator('password', 'rePassword'),
        } as AbstractControlOptions
    );

    getControl(name: string) {
        return this.form.get(name);
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const { token, password } = this.form.value;
        this.snackBar.open('Password reset successfully!');
        this.router.navigateByUrl('/auth/login');
        /*this.passwordSub = this.authService.resetPassword(token, password).subscribe({
            next: (response) => {
                this.snackBar.open('Password reset successfully!');
                this.router.navigateByUrl('/auth/login');
            },
            error: (error) => {
                this.snackBar.open('Error resetting password. Please try again later.', [
                    'snackbar-error',
                ]);
            },
        });*/
    }
}
