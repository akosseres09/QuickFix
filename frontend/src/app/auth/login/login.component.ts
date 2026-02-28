import { Component, DestroyRef, inject, signal } from '@angular/core';
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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

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
export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly authService = inject(AuthService);
    private readonly snackbarService = inject(SnackbarService);

    pwVisible = signal(false);
    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
    });

    togglePwVisibility(event: MouseEvent): void {
        const input = (event.target as HTMLElement)
            .closest('mat-form-field')
            ?.querySelector('input');

        if (input) {
            input.setAttribute(
                'type',
                input.getAttribute('type') === 'password' ? 'text' : 'password'
            );
            this.pwVisible.set(!this.pwVisible());
        }
    }

    getControl(controlName: string) {
        return this.loginForm.get(controlName);
    }

    onSubmit(): void {
        if (!this.loginForm.valid) return;

        const { email, password } = this.loginForm.value;

        if (!email || !password) return;

        this.authService
            .login(email, password)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.router.navigate(['/projects']);
                },
                error: (error) => {
                    console.error('Login error:', error.error?.message);
                    this.snackbarService.error(
                        error.error?.message || 'Login failed. Please try again.'
                    );
                },
            });
    }
}
