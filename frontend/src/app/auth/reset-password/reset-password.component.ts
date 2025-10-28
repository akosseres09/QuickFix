import { Component, inject, OnDestroy } from '@angular/core';
import { EmailFormComponent } from './email-form/email-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { ActivatedRoute } from '@angular/router';
import { ResetFormComponent } from './reset-form/reset-form.component';

@Component({
    selector: 'app-reset-password',
    imports: [EmailFormComponent, ReactiveFormsModule, CommonModule, ResetFormComponent],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnDestroy {
    emailSent: boolean = false;
    emailSub?: Subscription;
    passwordSub?: Subscription;
    currentRoute = inject(ActivatedRoute);
    token: string;

    constructor(private snackBar: SnackbarService) {
        this.token = this.currentRoute.snapshot.queryParamMap.get('token') ?? '';

        if (this.token) {
            this.emailSent = true;
        }
    }

    resend(email: string): void {
        if (!email) return;
        this.snackBar.open('Email sent successfully!');
        this.emailSent = true;
        /*this.emailSub = this.authService.resendEmail(email, '/auth/reset-password').subscribe({
            next: (response) => {
                this.snackBar.open('Email sent successfully!');
                this.emailSent = true;
            },
            error: (error) => {
                this.snackBar.open('Error sending email. Please try again later.', [
                    'snackbar-error',
                ]);
                console.error('Error in resend email:', error);
            },
        });*/
    }

    togglePage(): void {
        this.emailSent = !this.emailSent;
    }

    ngOnDestroy(): void {
        this.emailSub?.unsubscribe();
        this.passwordSub?.unsubscribe();
    }
}
