import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
    AbstractControlOptions,
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatPrefix,
    MatSuffix,
} from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth/auth.service';
import { passwordMatchValidator } from '../../shared/validators/passwordValidator/passwordValidator';
import { phoneValidator } from '../../shared/validators/phoneValidator/phoneValidator';
import { minAgeValidator } from '../../shared/validators/dateValidator/dateValidator';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { errorResponse } from '../../shared/model/Response';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SignupData } from '../../shared/constants/SignupData';

@Component({
    selector: 'app-signup',
    imports: [
        MatFormField,
        MatInput,
        MatLabel,
        MatSuffix,
        MatPrefix,
        MatError,
        MatIcon,
        MatButton,
        RouterLink,
        ReactiveFormsModule,
        CommonModule,
    ],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.css',
    standalone: true,
})
export class SignupComponent {
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private snackbar = inject(SnackbarService);
    private destroyRef = inject(DestroyRef);

    pwVisible = signal(false);
    rePwVisible = signal(false);
    signupErrors = signal<Array<string>>([]);
    signupForm = this.fb.group(
        {
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            username: ['', [Validators.required, Validators.minLength(5)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rePassword: ['', [Validators.required, Validators.minLength(6)]],
            dateOfBirth: [null as Date | null, [minAgeValidator(13)]],
            phoneNumber: ['', [phoneValidator()]],
        },
        {
            validators: passwordMatchValidator('password', 'rePassword'),
        } as AbstractControlOptions
    );

    togglePwVisibility(event: MouseEvent): void {
        const input = (event.target as HTMLElement)
            .closest('mat-form-field')
            ?.querySelector('input');

        if (input) {
            input.setAttribute(
                'type',
                input.getAttribute('type') === 'password' ? 'text' : 'password'
            );

            if (input.getAttribute('formcontrolname') === 'password') {
                this.pwVisible.set(!this.pwVisible());
            } else if (input.getAttribute('formcontrolname') === 'rePassword') {
                this.rePwVisible.set(!this.rePwVisible());
            }
        }
    }

    getControl(name: string) {
        return this.signupForm.get(name);
    }

    setServerValidationErrors(errorObj: Record<string, Array<string>>): void {
        Object.keys(errorObj).forEach((key) => {
            const control = this.getControl(key);
            if (control) {
                control.setErrors({ serverError: errorObj[key] });
            }
        });
    }

    onSubmit(): void {
        if (!this.signupForm.valid) return;

        this.authService
            .signup(this.signupForm.value as SignupData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.snackbar.open('Account created successfully! Please verify your email.');
                    this.router.navigateByUrl('/auth/verify');
                },
                error: (error) => {
                    const errorObj = error.error.error.details.error as Record<
                        string,
                        Array<string>
                    >;
                    this.setServerValidationErrors(errorObj);
                    this.snackbar.open(
                        (error.error as errorResponse).error.message ||
                            'Signup failed. Please try again.',
                        ['snackbar-error']
                    );
                },
            });
    }
}
