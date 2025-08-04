import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { CommonModule } from '@angular/common';
import { EmailFormComponent } from '../../common/email-form/email-form.component';

@Component({
    selector: 'app-resend-verification',
    imports: [RouterLink, ReactiveFormsModule, CommonModule, EmailFormComponent],
    templateUrl: './resend-verification.component.html',
    styleUrl: './resend-verification.component.css',
})
export class ResendVerificationComponent implements OnDestroy {
    sub?: Subscription;

    constructor(
        private authService: AuthService,
        private router: Router,
        private fb: FormBuilder,
        private snackbar: SnackbarService
    ) {}

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    resend(email: string) {
        if (!email) return;

        this.sub = this.authService.resendEmail(email).subscribe({
            next: (response) => {
                this.snackbar.open('Verification email sent successfully!');
                this.router.navigateByUrl('/auth/verify');
            },
            error: (error) => {
                const message =
                    error.error.message ||
                    'An error occurred while sending the verification email.';

                this.snackbar.open(message, ['snackbar-error']);
            },
        });
    }
}
