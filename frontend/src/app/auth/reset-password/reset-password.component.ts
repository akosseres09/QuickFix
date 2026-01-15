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
    private currentRoute = inject(ActivatedRoute);
    private snackBar = inject(SnackbarService);
    private destroyRef = inject(DestroyRef);
    private authService = inject(AuthService);
    private router = inject(Router);

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
                    this.snackBar.open('Email sent successfully!');
                    this.emailSent.set(true);
                },
                error: (error) => {
                    this.snackBar.open('Error sending email. Please try again later.', [
                        'snackbar-error',
                    ]);
                    console.error('Error in resend email:', error);
                },
            });
    }

    reset(event: { token: string; password: string }): void {
        this.authService
            .resetPassword(event.token, event.password)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.snackBar.open('Password reset successfully!');
                    this.router.navigateByUrl('/auth/login');
                },
                error: (error) => {
                    this.snackBar.open('Error resetting password. Please try again later.', [
                        'snackbar-error',
                    ]);
                },
            });
    }

    togglePage(): void {
        this.emailSent.set(!this.emailSent());
    }
}
