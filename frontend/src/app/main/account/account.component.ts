import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../shared/services/user/user.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { User } from '../../shared/model/User';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-account',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatChipsModule,
    ],
    templateUrl: './account.component.html',
    styleUrl: './account.component.css',
})
export class AccountComponent {
    private userService = inject(UserService);
    private snackbarService = inject(SnackbarService);
    private fb = inject(FormBuilder);

    user = signal<User | null>(this.userService.getUser());
    profileForm = this.fb.group({
        username: [this.user()?.username || '', [Validators.required, Validators.minLength(3)]],
        email: [this.user()?.email || '', [Validators.required, Validators.email]],
        bio: ['Passionate developer working on QuickFix project'],
        location: ['Budapest, Hungary'],
        company: ['QuickFix Inc.'],
        website: ['https://quickfix.com'],
    });
    private formValues = toSignal(this.profileForm.valueChanges, {
        initialValue: this.profileForm.value,
    });
    private initialFormSnapshot = signal(this.profileForm.value);

    profilePictureUrl = signal<string>(
        this.user()?.username
            ? `https://ui-avatars.com/api/?name=${this.user()?.username}&size=200&background=a494e6&color=0f0c18`
            : `https://ui-avatars.com/api/?name=User&size=200&background=a494e6&color=0f0c18`
    );

    selectedFile = signal<File | null>(null);
    previewUrl = signal<string | null>(null);
    fileInput = viewChild<ElementRef>('fileInput');

    hasChanges = computed(() => {
        const current = JSON.stringify(this.formValues());
        const initial = JSON.stringify(this.initialFormSnapshot());
        return current !== initial || this.selectedFile() !== null;
    });

    onFileSelected(event: Event): void {
        const input = this.fileInput()?.nativeElement as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.selectedFile.set(input.files[0]);

            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.previewUrl.set(e.target?.result as string);
            };
            reader.readAsDataURL(this.selectedFile() as File);
        }
    }

    triggerFileInput(): void {
        this.fileInput()?.nativeElement.click();
    }

    removeProfilePicture(): void {
        this.selectedFile.set(null);
        this.previewUrl.set(null);
        this.profilePictureUrl.set(
            `https://ui-avatars.com/api/?name=${this.user()?.username || 'User'}&size=200&background=a494e6&color=0f0c18`
        );
        this.resetFileInput();
    }

    saveChanges(): void {
        if (this.profileForm.invalid) {
            this.snackbarService.open('Please fill in all required fields correctly', [
                'snackbar-error',
            ]);
            return;
        }

        if (this.selectedFile()) {
            this.profilePictureUrl.set(this.previewUrl() || this.profilePictureUrl());
        }

        this.selectedFile.set(null);
        this.previewUrl.set(null);

        this.snackbarService.open('Profile updated successfully!');
    }

    cancelChanges(): void {
        this.profileForm.patchValue(this.initialFormSnapshot());
        this.selectedFile.set(null);
        this.previewUrl.set(null);
        this.resetFileInput();
    }

    resetFileInput(): void {
        const input = this.fileInput()?.nativeElement;
        if (input) {
            input.value = '';
        }
    }

    getControl(name: string) {
        return this.profileForm.get(name);
    }
}
