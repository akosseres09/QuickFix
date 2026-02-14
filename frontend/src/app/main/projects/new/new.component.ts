import {
    Component,
    DestroyRef,
    inject,
    OnInit,
    Signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule, formatDate } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../shared/services/project/project.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    PRIORITY_LIST,
    STATUS_LIST,
    VISIBILITY_LIST,
    PRIORITY_LOW,
    PRIORITY_MEDIUM,
    PRIORITY_HIGH,
    PRIORITY_CRITICAL,
    STATUS_ACTIVE,
    VISIBILITY_PUBLIC,
    Project,
} from '../../../shared/model/Project';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { AuthService } from '../../../shared/services/auth/auth.service';

@Component({
    selector: 'app-new',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatSliderModule,
        MatDatepickerModule,
        MatNativeDateModule,
        RouterLink,
    ],
    templateUrl: './new.component.html',
    styleUrl: './new.component.css',
})
export class NewComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly projectService = inject(ProjectService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly dialogService = inject(DialogService);
    private readonly authService = inject(AuthService);

    readonly priorityList = PRIORITY_LIST;
    readonly statusList = STATUS_LIST;
    readonly visibilityList = VISIBILITY_LIST;
    readonly userId = this.authService.currentUserClaims()?.uid;

    projectForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        key: [
            '',
            [Validators.required, Validators.maxLength(10), Validators.pattern(/^[A-Z0-9_-]+$/)],
        ],
        description: [''],
        status: [STATUS_ACTIVE, Validators.required],
        startDate: [null as string | null],
        endDate: [null as string | null],
        visibility: [VISIBILITY_PUBLIC, Validators.required],
        priority: [PRIORITY_MEDIUM, Validators.required],
        color: ['#3b82f6', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
        progress: [0, [Validators.min(0), Validators.max(100)]],
        budget: [0, [Validators.min(0)]],
    });

    infoDialogRef: Signal<TemplateRef<any> | undefined> = viewChild('infoDialog');

    ngOnInit(): void {
        // Auto-generate key from name
        this.projectForm.get('name')?.valueChanges.subscribe((name) => {
            if (name && !this.projectForm.get('key')?.dirty) {
                const key = name
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .substring(0, 10);
                this.projectForm.get('key')?.setValue(key, { emitEvent: false });
            }
        });
    }

    onSubmit(): void {
        if (!this.userId) {
            console.error('User ID is required to create a project.');
            return;
        }

        if (this.projectForm.invalid) {
            this.projectForm.markAllAsTouched();
            return;
        }

        const formValue = {
            ...this.projectForm.value,
            startDate: this.projectForm.value.startDate
                ? formatDate(this.projectForm.value.startDate, 'yyyy-MM-dd', 'en-US')
                : null,
            endDate: this.projectForm.value.endDate
                ? formatDate(this.projectForm.value.endDate, 'yyyy-MM-dd', 'en-US')
                : null,
            ownerId: this.userId,
        } as Partial<Project>;

        console.log(formValue);
        this.projectService
            .createProject(formValue)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (project) => {
                    this.router.navigate(['/project', project.key]);
                },
                error: (error) => {
                    console.error('Error creating project:', error);
                },
            });
    }

    onCancel(): void {
        this.router.navigate(['/projects']);
    }

    getPriorityLabel(priority: number): string {
        switch (priority) {
            case PRIORITY_LOW:
                return 'Low';
            case PRIORITY_MEDIUM:
                return 'Medium';
            case PRIORITY_HIGH:
                return 'High';
            case PRIORITY_CRITICAL:
                return 'Critical';
            default:
                return 'Unknown';
        }
    }

    getStatusLabel(status: string): string {
        return status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    getVisibilityLabel(visibility: string): string {
        return visibility.charAt(0).toUpperCase() + visibility.slice(1);
    }

    openInfo(): void {
        const dialogRef = this.infoDialogRef();
        if (!dialogRef) return;
        this.dialogService.openConfirmDialog('Project Information', dialogRef, {
            width: '600px',
        });
    }
}
