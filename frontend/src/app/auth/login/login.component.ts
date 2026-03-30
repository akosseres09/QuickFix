import { Component, inject, signal } from '@angular/core';
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
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { OrganizationInvitationService } from '../../shared/services/organization-invitation/organization-invitation.service';
import { finalize } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

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
        MatProgressSpinner,
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
    standalone: true,
})
export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly invitationService = inject(OrganizationInvitationService);
    redirectUrl = sessionStorage.getItem('redirectUrl');

    pwVisible = signal(false);
    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
    });
    isLoading = signal(false);

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

        this.isLoading.set(true);

        this.authService
            .login(email, password)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (result) => {
                    sessionStorage.removeItem('redirectUrl');
                    this.invitationService.deleteInvitationToken();
                    this.router.navigate([this.redirectUrl || '/organizations']);
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
