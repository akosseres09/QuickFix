import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { CommonModule, formatDate } from '@angular/common';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { SignupData } from '../../shared/constants/user/SignupData';
import { CustomValidators } from '../../shared/validators/CustomValidators';
import { decodeToken } from '../../shared/utils/jwtDecoder';
import { InvitationTokenPayload } from '../../shared/constants/token/InvitationTokenPayload';
import { finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { applyValidationErrors } from '../../shared/utils/formErrorHandler';

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
        MatProgressSpinnerModule,
        MatDatepickerModule,
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.css',
    standalone: true,
})
export class SignupComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly snackbar = inject(SnackbarService);

    private readonly token = signal<string>(sessionStorage.getItem('invitationToken') || '');
    private readonly payload = computed<InvitationTokenPayload | null>(() => {
        const tokenValue = this.token();
        return tokenValue ? decodeToken<InvitationTokenPayload>(tokenValue) : null;
    });

    maxDate = signal<Date>(this.getMaxDate());
    pwVisible = signal(false);
    rePwVisible = signal(false);
    signupErrors = signal<Array<string>>([]);
    signupForm = this.fb.group(
        {
            firstName: this.fb.control('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            lastName: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
            username: this.fb.control('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(5)],
            }),
            email: this.fb.control(this.payload()?.email || '', {
                nonNullable: true,
                validators: [Validators.required, Validators.email],
            }),
            password: this.fb.control('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(6)],
            }),
            confirmPassword: this.fb.control('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(6)],
            }),
            dateOfBirth: this.fb.control(null as Date | null, {
                validators: [CustomValidators.minAgeValidator(13)],
            }),
            phoneNumber: this.fb.control('', { validators: [CustomValidators.phoneValidator()] }),
        },
        {
            validators: CustomValidators.passwordMatchValidator('password', 'confirmPassword'),
        } as AbstractControlOptions
    );

    isLoading = signal(false);

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

    onSubmit(): void {
        if (this.signupForm.invalid) return;

        this.isLoading.set(true);

        const payload = this.payload();
        if (payload && payload.email !== this.signupForm.get('email')?.value) {
            this.signupForm.get('email')?.setValue(payload.email);
        }

        const formValues = this.signupForm.getRawValue();
        const isRequiredFieldsEmpty = Object.entries(formValues)
            .filter(([key]) =>
                [
                    'firstName',
                    'lastName',
                    'username',
                    'email',
                    'password',
                    'confirmPassword',
                ].includes(key)
            )
            .some(([_, value]) => !value);

        if (isRequiredFieldsEmpty) {
            this.snackbar.error('Please fill in all required fields.');
            this.isLoading.set(false);
            return;
        }

        const dob = this.signupForm.get('dateOfBirth')?.value;
        const data: SignupData = {
            firstName: formValues.firstName,
            lastName: formValues.lastName,
            username: formValues.username,
            email: formValues.email,
            password: formValues.password,
            confirmPassword: formValues.confirmPassword,
            dateOfBirth: dob ? formatDate(dob, 'yyyy-MM-dd', 'en-US') : undefined,
            phoneNumber: formValues.phoneNumber ?? undefined,
        };

        this.authService
            .signup(data)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (_) => {
                    this.snackbar.success(
                        'Account created successfully! Please verify your email.'
                    );
                    sessionStorage.removeItem('invitationToken');
                    this.router.navigateByUrl('/auth/verify');
                },
                error: (error) => {
                    applyValidationErrors(this.signupForm, error);
                    this.snackbar.error(
                        error.error?.error?.message || 'Signup failed. Please try again.'
                    );
                },
            });
    }

    private getMaxDate(): Date {
        return new Date(new Date().setFullYear(new Date().getFullYear() - 16));
    }
}
