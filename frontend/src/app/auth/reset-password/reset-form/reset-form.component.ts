import { Component, inject, output, signal } from '@angular/core';
import {
    AbstractControlOptions,
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { passwordMatchValidator } from '../../../shared/validators/passwordValidator/passwordValidator';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-reset-form',
    imports: [
        ReactiveFormsModule,
        CommonModule,
        MatInput,
        MatFormField,
        MatLabel,
        MatIcon,
        MatError,
        MatButton,
        MatPrefix,
    ],
    templateUrl: './reset-form.component.html',
    styleUrl: './reset-form.component.css',
})
export class ResetFormComponent {
    private fb = inject(FormBuilder);
    private activeRoute = inject(ActivatedRoute);

    sendForm = output<{ token: string; password: string }>();

    token = signal<string>(this.activeRoute.snapshot.queryParamMap.get('token') ?? '');
    form = this.fb.group(
        {
            token: [this.token(), [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rePassword: ['', [Validators.required, Validators.minLength(6)]],
        },
        {
            validators: passwordMatchValidator('password', 'rePassword'),
        } as AbstractControlOptions
    );

    getControl(name: string) {
        return this.form.get(name);
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        const { token, password } = this.form.value;
        if (!token || !password) return;

        this.sendForm.emit({ token, password });
    }
}
