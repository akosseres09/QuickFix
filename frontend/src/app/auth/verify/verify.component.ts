import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

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
export class VerifyComponent implements OnInit, OnDestroy {
    verifyForm: FormGroup;
    verifySub?: Subscription;
    verifyPage: boolean = true;
    currentRoute = inject(ActivatedRoute);

    constructor(
        private authService: AuthService,
        private router: Router,
        private fb: FormBuilder,
        private snackbar: SnackbarService
    ) {
        const token = this.currentRoute.snapshot.queryParamMap.get('token') ?? '';

        this.verifyForm = this.fb.group({
            token: [token, [Validators.required, Validators.maxLength(255)]],
        });
    }

    ngOnInit() {}

    ngOnDestroy() {
        this.verifySub?.unsubscribe();
    }

    onSubmit() {
        if (!this.verifyForm.valid) return;

        const token = this.getControl('token')?.value;

        if (!token) return;

        this.snackbar.open('Account Verified!');
        this.router.navigateByUrl('/auth/login');

        /*this.authService.verify(token as string).subscribe({
            next: (response) => {
                this.snackbar.open('Account Verified!');
                this.router.navigateByUrl('/auth/login');
            },
            error: (error) => {
                console.error(error);
                this.snackbar.open('Failed to verify account!', ['snackbar-error']);
            },
        });*/
    }

    resendVerificationEmail() {}

    getControl(name: string) {
        return this.verifyForm.get(name);
    }

    togglePage() {
        this.verifyPage = !this.verifyPage;
    }
}
