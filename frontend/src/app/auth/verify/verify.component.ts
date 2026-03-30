import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-verify',
    imports: [
        MatInput,
        MatFormField,
        MatLabel,
        MatPrefix,
        MatError,
        MatButton,
        ReactiveFormsModule,
        MatIcon,
        CommonModule,
        RouterLink,
        MatProgressSpinnerModule,
    ],
    templateUrl: './verify.component.html',
    styleUrl: './verify.component.css',
    standalone: true,
})
export class VerifyComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly snackbar = inject(SnackbarService);
    private readonly currentRoute = inject(ActivatedRoute);

    token = signal(this.currentRoute.snapshot.queryParamMap.get('token') ?? '');
    verifyPage = signal(true);
    verifyForm = this.fb.group({
        token: [this.token(), [Validators.required, Validators.maxLength(255)]],
    });
    isLoading = signal(false);

    onSubmit() {
        if (this.verifyForm.invalid) return;

        const token = this.getControl('token')?.value;
        if (!token) {
            this.verifyForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.authService
            .verify(token as string)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.snackbar.success('Account Verified!');
                    this.router.navigateByUrl('/auth/login');
                },
                error: (error) => {
                    console.error(error);
                    this.snackbar.error('Failed to verify account!');
                },
            });
    }

    getControl(name: string) {
        return this.verifyForm.get(name);
    }
}
