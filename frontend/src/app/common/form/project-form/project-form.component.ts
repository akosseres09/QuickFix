import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, input, model, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatOptionModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import {
    PRIORITY_COLOR_MAP,
    PRIORITY_LIST,
    PRIORITY_MAP,
    Project,
    ProjectPriority,
    ProjectStatus,
    ProjectVisibility,
    STATUS_COLOR_MAP,
    STATUS_LIST,
    STATUS_MAP,
    VISIBILITY_LIST,
    VISIBILITY_MAP,
} from '../../../shared/model/Project';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-project-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatSliderModule,
        MatIconModule,
        MatOptionModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        RouterLink,
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './project-form.component.html',
    styleUrl: './project-form.component.css',
})
export class ProjectFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly authService = inject(AuthService);

    readonly userId = this.authService.currentUserClaims()?.uid;

    readonly priorityList = PRIORITY_LIST;
    readonly priorityMap = PRIORITY_MAP;
    readonly priorityColorMap = PRIORITY_COLOR_MAP;

    readonly statusList = STATUS_LIST;
    readonly statusMap = STATUS_MAP;
    readonly statusColorMap = STATUS_COLOR_MAP;

    readonly visibilityList = VISIBILITY_LIST;
    readonly visibilityMap = VISIBILITY_MAP;

    project = input<Project | null>(null);
    buttonText = input<string>('Create Project');
    icon = input<string>('add');
    isSubmitting = model<boolean>(false);

    formSubmitted = output<Partial<Project>>();

    projectForm!: FormGroup;

    ngOnInit(): void {
        this.projectForm = this.fb.group({
            name: [this.project()?.name || '', [Validators.required, Validators.maxLength(255)]],
            key: [
                this.project()?.key || '',
                [
                    Validators.required,
                    Validators.maxLength(10),
                    Validators.pattern(/^[A-Z0-9_-]+$/),
                ],
            ],
            description: [this.project()?.description || ''],
            visibility: [
                this.project()?.visibility ?? ProjectVisibility.PRIVATE,
                Validators.required,
            ],
            status: [this.project()?.status ?? ProjectStatus.ACTIVE, Validators.required],
            priority: [this.project()?.priority ?? ProjectPriority.MEDIUM, Validators.required],
        });

        if (this.project()) return;

        // Auto-generate key from name if there is no project
        this.projectForm
            .get('name')
            ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((name) => {
                if (name && !this.projectForm.get('key')?.dirty) {
                    const key = name
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .substring(0, 10);
                    this.projectForm.get('key')?.setValue(key, { emitEvent: false });
                }
            });
    }

    getPriorityLabel(priority: number): string {
        switch (priority) {
            case ProjectPriority.LOW:
                return 'Low';
            case ProjectPriority.MEDIUM:
                return 'Medium';
            case ProjectPriority.HIGH:
                return 'High';
            case ProjectPriority.CRITICAL:
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

    onSubmit() {
        if (!this.userId) {
            console.error('User ID is required to create a project.');
            return;
        }

        if (this.projectForm.invalid) {
            this.projectForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);

        const projectData: Partial<Project> = {
            name: this.projectForm.value.name,
            key: this.projectForm.value.key,
            description: this.projectForm.value.description,
            status: this.projectForm.value.status,
            visibility: this.projectForm.value.visibility,
            priority: this.projectForm.value.priority,
            ownerId: this.userId,
        };

        this.formSubmitted.emit(projectData);
    }
}
