import { Component, DestroyRef, inject, signal } from '@angular/core';
import { EmailFormComponent } from './email-form/email-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResetFormComponent } from './reset-form/reset-form.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-reset-password',
    imports: [EmailFormComponent, ReactiveFormsModule, CommonModule, ResetFormComponent],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
    private readonly currentRoute = inject(ActivatedRoute);
    private readonly snackBar = inject(SnackbarService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    token = signal<string>(this.currentRoute.snapshot.queryParamMap.get('token') ?? '');
    emailSent = signal(false);

    constructor() {
        if (this.token()) {
            this.emailSent.set(true);
        }
    }

    resend(email: string): void {
        if (!email) return;

        this.authService
            .resendEmail(email, '/auth/reset-password')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.snackBar.success('Email sent successfully!');
                    this.emailSent.set(true);
                },
                error: (error) => {
                    this.snackBar.error('Error sending email. Please try again later.');
                    console.error('Error in resend email:', error.error?.message || error);
                },
            });
    }

    reset(event: { token: string; password: string }): void {
        this.authService
            .resetPassword(event.token, event.password)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.snackBar.success('Password reset successfully!');
                    this.router.navigateByUrl('/auth/login');
                },
                error: (error) => {
                    const message =
                        error.error?.message || 'Error resetting password. Please try again later.';
                    this.snackBar.error(message);
                    console.error('Error in reset password:', message);
                },
            });
    }

    togglePage(): void {
        this.emailSent.set(!this.emailSent());
    }
}
