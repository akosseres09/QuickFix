import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
export class AccountComponent implements OnInit {
    private userService = inject(UserService);
    private snackbarService = inject(SnackbarService);
    private fb = inject(FormBuilder);

    user: User | null = null;
    profileForm!: FormGroup;
    profilePictureUrl: string =
        'https://ui-avatars.com/api/?name=Admin&size=200&background=a494e6&color=0f0c18';
    initialFormValue: any;
    selectedFile: File | null = null;
    previewUrl: string | null = null;

    ngOnInit(): void {
        this.user = this.userService.getUser();

        if (this.user) {
            this.profilePictureUrl = `https://ui-avatars.com/api/?name=${this.user.username}&size=200&background=a494e6&color=0f0c18`;
        }

        this.profileForm = this.fb.group({
            username: [this.user?.username || '', [Validators.required, Validators.minLength(3)]],
            email: [this.user?.email || '', [Validators.required, Validators.email]],
            bio: ['Passionate developer working on QuickFix project'],
            location: ['Budapest, Hungary'],
            company: ['QuickFix Inc.'],
            website: ['https://quickfix.com'],
        });

        this.initialFormValue = this.profileForm.value;
    }

    get hasChanges(): boolean {
        return (
            JSON.stringify(this.profileForm.value) !== JSON.stringify(this.initialFormValue) ||
            this.selectedFile !== null
        );
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.selectedFile = input.files[0];

            // Create preview
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.previewUrl = e.target?.result as string;
            };
            reader.readAsDataURL(this.selectedFile);
        }
    }

    triggerFileInput(): void {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        fileInput.click();
    }

    removeProfilePicture(): void {
        this.selectedFile = null;
        this.previewUrl = null;
        this.profilePictureUrl = `https://ui-avatars.com/api/?name=${this.user?.username || 'User'}&size=200&background=a494e6&color=0f0c18`;
    }

    saveChanges(): void {
        if (this.profileForm.invalid) {
            this.snackbarService.open('Please fill in all required fields correctly', [
                'snackbar-error',
            ]);
            return;
        }

        // Here you would typically make an API call to update the user
        // For now, we'll just show a success message

        if (this.selectedFile) {
            // Handle file upload
            console.log('Uploading file:', this.selectedFile.name);
            this.profilePictureUrl = this.previewUrl || this.profilePictureUrl;
        }

        this.initialFormValue = this.profileForm.value;
        this.selectedFile = null;
        this.previewUrl = null;

        this.snackbarService.open('Profile updated successfully!');
    }

    cancelChanges(): void {
        this.profileForm.patchValue(this.initialFormValue);
        this.selectedFile = null;
        this.previewUrl = null;
    }

    getControl(name: string) {
        return this.profileForm.get(name);
    }
}
