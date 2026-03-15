import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { errorResponse } from '../../shared/model/Response';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SignupData } from '../../shared/constants/user/SignupData';
import { CustomValidators } from '../../shared/validators/CustomValidators';
import { decodeToken } from '../../shared/utils/jwtDecoder';
import { InvitationTokenPayload } from '../../shared/constants/token/InvitationTokenPayload';

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
export class SignupComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly snackbar = inject(SnackbarService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly token = signal<string>(sessionStorage.getItem('invitationToken') || '');
    private readonly payload = computed<InvitationTokenPayload | null>(() => {
        const tokenValue = this.token();
        return tokenValue ? decodeToken<InvitationTokenPayload>(tokenValue) : null;
    });

    pwVisible = signal(false);
    rePwVisible = signal(false);
    signupErrors = signal<Array<string>>([]);
    signupForm = this.fb.group(
        {
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            username: ['', [Validators.required, Validators.minLength(5)]],
            email: [this.payload()?.email || '', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
            dateOfBirth: [null as Date | null, [CustomValidators.minAgeValidator(13)]],
            phoneNumber: ['', [CustomValidators.phoneValidator()]],
        },
        {
            validators: CustomValidators.passwordMatchValidator('password', 'confirmPassword'),
        } as AbstractControlOptions
    );

    ngOnInit(): void {
        const payload = this.payload();
        if (payload) {
            this.signupForm.get('email')?.disable();
        }
    }

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
            } else if (input.getAttribute('formcontrolname') === 'confirmPassword') {
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
            .signup(this.signupForm.getRawValue() as SignupData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.snackbar.success(
                        'Account created successfully! Please verify your email.'
                    );
                    sessionStorage.removeItem('invitationToken');
                    this.router.navigateByUrl('/auth/verify');
                },
                error: (error) => {
                    const errorObj = error.error.error.details.error as Record<
                        string,
                        Array<string>
                    >;
                    this.setServerValidationErrors(errorObj);
                    this.snackbar.error(
                        (error.error as errorResponse).error.message ||
                            'Signup failed. Please try again.'
                    );
                },
            });
    }
}
