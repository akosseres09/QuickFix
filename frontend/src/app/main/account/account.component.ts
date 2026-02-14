import {
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    signal,
    viewChild,
} from '@angular/core';
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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DateService } from '../../shared/services/date/date.service';
import {
    maxAgeValidator,
    minAgeValidator,
} from '../../shared/validators/dateValidator/dateValidator';
import { phoneValidator } from '../../shared/validators/phoneValidator/phoneValidator';
import { AuthService } from '../../shared/services/auth/auth.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

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
        MatDatepickerModule,
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './account.component.html',
    styleUrl: './account.component.css',
})
export class AccountComponent {
    private readonly userService = inject(UserService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly dateService = inject(DateService);
    private readonly authService = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);

    user = signal<User | null>(null);
    profileForm = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [phoneValidator()]],
        dateOfBirth: ['', [minAgeValidator(13), maxAgeValidator(75)]],
    });
    private formValues = toSignal(this.profileForm.valueChanges, {
        initialValue: this.profileForm.value,
    });
    private initialFormSnapshot = signal(this.profileForm.value);

    profilePictureUrl = signal<string>('');
    selectedFile = signal<File | null>(null);
    previewUrl = signal<string | null>(null);
    fileInput = viewChild<ElementRef>('fileInput');

    hasChanges = computed(() => {
        const current = JSON.stringify(this.formValues());
        const initial = JSON.stringify(this.initialFormSnapshot());
        return this.canEdit() && (current !== initial || this.selectedFile() !== null);
    });

    minDate = signal<Date>(this.getMinDate());

    constructor() {
        this.userService
            .getUser()
            .pipe(takeUntilDestroyed())
            .subscribe((userData) => {
                this.user.set(userData);

                this.profilePictureUrl.set(this.getProfilePicture());
                this.initialFormSnapshot.set({
                    username: userData.username || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    dateOfBirth: userData.dateOfBirth,
                });
                this.setProfileFormValues();
            });
    }

    getMinDate(): Date {
        const today = new Date();
        const minYear = today.getFullYear() - 13;
        return new Date(minYear, today.getMonth(), today.getDate());
    }

    getProfilePicture(): string {
        const user = this.user();
        if (!user) return '';

        if (user.profilePictureUrl) {
            return user.profilePictureUrl;
        }

        const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;

        if (initials) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=128`;
        }

        const usernameInitial = user.username.charAt(0);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(usernameInitial)}&background=random&size=128`;
    }

    setProfileFormValues(): void {
        if (!this.user()) return;

        this.profileForm.patchValue({
            username: this.user()?.username || '',
            email: this.user()?.email || '',
            phoneNumber: this.user()?.phoneNumber || '',
            dateOfBirth: this.user()?.dateOfBirth,
        });
    }

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
        this.profilePictureUrl.set(this.user()?.profilePictureUrl as string);
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

        this.userService
            .updateUser(this.profileForm.value as Partial<User>)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.user.set(response);
                    this.initialFormSnapshot.set(this.profileForm.value);
                    this.snackbarService.open('Profile updated successfully!');
                },
                error: (error) => {
                    this.snackbarService.open('Failed to update profile', ['snackbar-error']);
                },
            });

        this.selectedFile.set(null);
        this.previewUrl.set(null);
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

    createDate(timestamp: number) {
        const date = this.dateService.parseTimestamp(timestamp);
        return this.dateService.toLocaleISOString(date).split('T')[0];
    }

    canEdit(): boolean {
        const uid = this.authService.currentUserClaims()?.uid;
        if (!uid) return false;

        const user = this.user();
        if (!user) return false;

        return uid === user.id;
    }
}
