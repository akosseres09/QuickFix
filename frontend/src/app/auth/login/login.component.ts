import { Component, OnInit } from '@angular/core';
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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    imports: [
        MatInput,
        MatButton,
        MatFormField,
        MatLabel,
        MatIcon,
        MatPrefix,
        MatSuffix,
        MatError,
        RouterLink,
        ReactiveFormsModule,
        CommonModule,
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
    standalone: true,
})
export class LoginComponent implements OnInit {
    pwVisible = false;
    loginForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
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
            this.pwVisible = !this.pwVisible;
        }
    }

    getControl(controlName: string) {
        return this.loginForm.get(controlName);
    }

    onSubmit(): void {
        if (!this.loginForm.valid) return;

        const { email, password } = this.loginForm.value;
        this.router.navigateByUrl('/dashboard');
    }
}
