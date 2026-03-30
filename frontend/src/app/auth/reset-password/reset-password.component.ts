import { Component, inject, signal } from '@angular/core';
import {
    AbstractControlOptions,
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CustomValidators } from '../../shared/validators/CustomValidators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { applyValidationErrors } from '../../shared/utils/formErrorHandler';

@Component({
    selector: 'app-reset-password',
    imports: [
        ReactiveFormsModule,
        CommonModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
    private readonly currentRoute = inject(ActivatedRoute);
    private readonly snackBar = inject(SnackbarService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);

    token = signal<string>(this.currentRoute.snapshot.queryParamMap.get('token') ?? '');
    form = this.fb.group(
        {
            token: [this.token(), [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rePassword: ['', [Validators.required, Validators.minLength(6)]],
        },
        {
            validators: CustomValidators.passwordMatchValidator('password', 'rePassword'),
        } as AbstractControlOptions
    );
    isLoading = signal(false);

    getControl(name: string) {
        return this.form.get(name);
    }

    reset(): void {
        const { token, password } = this.form.value;
        if (!token || !password || this.form.invalid) return;

        this.isLoading.set(true);
        this.authService
            .resetPassword(token, password)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.snackBar.success('Password reset successfully!');
                    this.router.navigateByUrl('/auth/login');
                },
                error: (error) => {
                    applyValidationErrors(this.form, error);
                    const message =
                        error.error?.error?.message ||
                        error.error?.message ||
                        'Error resetting password. Please try again later.';
                    this.snackBar.error(message);
                },
            });
    }
}
