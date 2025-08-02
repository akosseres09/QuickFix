import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
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
import { RouterLink } from '@angular/router';

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
})
export class SignupComponent implements OnInit {
    pwVisible = false;
    rePwVisible = false;
    signupForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.signupForm = this.fb.group(
            {
                username: ['', [Validators.required, Validators.minLength(5)]],
                email: ['', [Validators.required, Validators.email]],
                password: ['', [Validators.required, Validators.minLength(6)]],
                rePassword: [
                    '',
                    [Validators.required, Validators.minLength(6)],
                ],
            },
            {
                validators: this.passwordMatchValidator(
                    'password',
                    'rePassword'
                ),
            }
        );
    }

    ngOnInit(): void {}

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
                this.pwVisible = !this.pwVisible;
            } else if (input.getAttribute('formcontrolname') === 'rePassword') {
                this.rePwVisible = !this.rePwVisible;
            }
        }
    }

    getControl(name: string) {
        return this.signupForm.get(name);
    }

    onSubmit(): void {
        if (!this.signupForm.valid) return;

        console.log('Signup attempt:', this.signupForm.value);
    }

    passwordMatchValidator(controlName: string, mactchingControlName: string) {
        return (FormGroup: FormGroup) => {
            const control = FormGroup.controls[controlName];
            const matchingControl = FormGroup.controls[mactchingControlName];

            if (
                control.value !== matchingControl.value &&
                matchingControl.touched &&
                control.touched
            ) {
                matchingControl.setErrors({ mustMatch: true });
                control.setErrors({ mustMatch: true });
            } else if (
                control.value === matchingControl.value &&
                (!control.errors || !matchingControl.errors)
            ) {
                matchingControl.setErrors(null);
                control.setErrors(null);
            }
        };
    }
}
