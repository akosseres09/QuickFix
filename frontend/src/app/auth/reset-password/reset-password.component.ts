import { Component, inject, Inject, OnDestroy } from '@angular/core';
import { EmailFormComponent } from '../../common/email-form/email-form.component';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { passwordMatchValidator } from '../../shared/validators/passwordValidator/passwordValidator';
import { Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { ActivatedRoute, Router } from '@angular/router';

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
export class ResetPasswordComponent implements OnDestroy {
    form: FormGroup;
    emailSent: boolean = false;
    emailSub?: Subscription;
    passwordSub?: Subscription;
    currentRoute = inject(ActivatedRoute);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private snackBar: SnackbarService,
        private router: Router
    ) {
        const token = this.currentRoute.snapshot.queryParamMap.get('token') ?? '';

        if (token) {
            this.emailSent = true;
        }

        this.form = this.fb.group(
            {
                token: new FormControl(token, [Validators.required]),
                password: new FormControl('', [Validators.required, Validators.minLength(6)]),
                rePassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
            },
            {
                validators: passwordMatchValidator('password', 'rePassword'),
            }
        );
    }

    resend(email: string): void {
        if (!email) return;

        this.emailSub = this.authService.resendEmail(email, '/auth/reset-password').subscribe({
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
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const { token, password } = this.form.value;

        this.passwordSub = this.authService.resetPassword(token, password).subscribe({
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

    getControl(name: string) {
        return this.form.get(name);
    }

    togglePage(): void {
        this.emailSent = !this.emailSent;
    }

    ngOnDestroy(): void {
        this.emailSub?.unsubscribe();
        this.passwordSub?.unsubscribe();
    }
}
