import { Component, DestroyRef, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { CommonModule } from '@angular/common';
import { EmailFormComponent } from '../reset-password/email-form/email-form.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-resend-verification',
    imports: [RouterLink, ReactiveFormsModule, CommonModule, EmailFormComponent],
    templateUrl: './resend-verification.component.html',
    styleUrl: './resend-verification.component.css',
})
export class ResendVerificationComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly snackbar = inject(SnackbarService);
    private readonly destroyRef = inject(DestroyRef);

    resend(email: string) {
        if (!email) return;

        this.authService
            .resendEmail(email)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.snackbar.success('Verification email sent successfully!');
                    this.router.navigateByUrl('/auth/verify');
                },
                error: (error) => {
                    const message =
                        error.error.message ||
                        'An error occurred while sending the verification email.';

                    this.snackbar.error(message);
                },
            });
    }
}
