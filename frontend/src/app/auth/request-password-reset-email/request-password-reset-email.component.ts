import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { applyValidationErrors } from '../../shared/utils/formErrorHandler/formErrorHandler';

@Component({
    selector: 'app-request-password-reset-email',
    imports: [
        RouterLink,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        MatIconModule,
    ],
    templateUrl: './request-password-reset-email.component.html',
    styleUrl: './request-password-reset-email.component.css',
})
export class RequestPasswordResetEmailComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(SnackbarService);

    protected form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
    });

    protected isLoading = signal(false);

    getControl(name: string) {
        return this.form.get(name);
    }

    onSubmit() {
        if (!this.form.valid) return;
    }

    resend(email: string): void {
        if (!email) return;

        this.isLoading.set(true);
        this.authService
            .resendEmail(email, '/auth/reset-password')
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (_) => {
                    this.snackBar.success('Email sent successfully!');
                },
                error: (error) => {
                    applyValidationErrors(this.form, error);
                    this.snackBar.error(
                        error.error?.error?.message ||
                            error.error?.message ||
                            'Error sending email. Please try again later.'
                    );
                },
            });
    }
}
