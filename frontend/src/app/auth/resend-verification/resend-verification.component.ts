import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { applyValidationErrors } from '../../shared/utils/formErrorHandler';

@Component({
    selector: 'app-resend-verification',
    imports: [
        RouterLink,
        ReactiveFormsModule,
        CommonModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatInputModule,
        MatButtonModule,
        ReactiveFormsModule,
        MatIconModule,
    ],
    templateUrl: './resend-verification.component.html',
    styleUrl: './resend-verification.component.css',
})
export class ResendVerificationComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly snackbar = inject(SnackbarService);
    private readonly fb = inject(FormBuilder);

    protected form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
    });

    protected isLoading = signal(false);

    getControl(name: string) {
        return this.form.get(name);
    }

    resend() {
        if (!this.form.valid) return;

        const email = this.form.get('email')?.value;
        if (!email) return;

        this.isLoading.set(true);
        this.authService
            .resendEmail(email)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (_) => {
                    this.snackbar.success('Verification email sent successfully!');
                    this.router.navigateByUrl('/auth/verify');
                },
                error: (error) => {
                    applyValidationErrors(this.form, error);
                    const message =
                        error.error?.error?.message ||
                        error.error?.message ||
                        'An error occurred while sending the verification email.';

                    this.snackbar.error(message);
                },
            });
    }
}
