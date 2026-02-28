import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    ],
    templateUrl: './verify.component.html',
    styleUrl: './verify.component.css',
    standalone: true,
})
export class VerifyComponent implements OnDestroy {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly snackbar = inject(SnackbarService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly currentRoute = inject(ActivatedRoute);

    token = signal(this.currentRoute.snapshot.queryParamMap.get('token') ?? '');
    verifyPage = signal(true);
    verifyForm = this.fb.group({
        token: [this.token(), [Validators.required, Validators.maxLength(255)]],
    });
    verifySub: Subscription | null = null;

    ngOnDestroy() {
        this.verifySub?.unsubscribe();
    }

    onSubmit() {
        if (this.verifyForm.invalid) return;

        const token = this.getControl('token')?.value;

        if (!token) return;

        this.snackbar.open('Account Verified!');
        this.router.navigateByUrl('/auth/login');

        this.authService
            .verify(token as string)
            .pipe(takeUntilDestroyed(this.destroyRef))
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

    resendVerificationEmail() {}

    getControl(name: string) {
        return this.verifyForm.get(name);
    }

    togglePage() {
        this.verifyPage.set(!this.verifyPage());
    }
}
