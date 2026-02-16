import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatOptionModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import {
    PRIORITY_CRITICAL,
    PRIORITY_HIGH,
    PRIORITY_LIST,
    PRIORITY_LOW,
    PRIORITY_MEDIUM,
    Project,
    STATUS_ACTIVE,
    STATUS_LIST,
    VISIBILITY_LIST,
    VISIBILITY_PUBLIC,
} from '../../../shared/model/Project';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../../shared/services/project/project.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
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
    private readonly projectService = inject(ProjectService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly userId = this.authService.currentUserClaims()?.uid;

    readonly priorityList = PRIORITY_LIST;
    readonly statusList = STATUS_LIST;
    readonly visibilityList = VISIBILITY_LIST;

    project = input<Project | null>(null);

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
            status: [this.project()?.status || STATUS_ACTIVE, Validators.required],
            startDate: [this.project()?.startDate || (null as string | null)],
            endDate: [this.project()?.endDate || (null as string | null)],
            visibility: [this.project()?.visibility || VISIBILITY_PUBLIC, Validators.required],
            priority: [this.project()?.priority || PRIORITY_MEDIUM, Validators.required],
            color: [this.project()?.color || '#3b82f6', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
            progress: [this.project()?.progress || 0, [Validators.min(0), Validators.max(100)]],
            budget: [this.project()?.budget || 0, [Validators.min(0)]],
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

    onSubmit() {
        if (!this.userId) {
            console.error('User ID is required to create a project.');
            return;
        }

        if (this.projectForm.invalid) {
            this.projectForm.markAllAsTouched();
            return;
        }

        const projectData: Partial<Project> = {
            name: this.projectForm.value.name,
            key: this.projectForm.value.key,
            description: this.projectForm.value.description,
            status: this.projectForm.value.status,
            visibility: this.projectForm.value.visibility,
            priority: this.projectForm.value.priority,
            color: this.projectForm.value.color,
            progress: this.projectForm.value.progress,
            budget: this.projectForm.value.budget,
            startDate: this.projectForm.value.startDate
                ? formatDate(this.projectForm.value.startDate, 'yyyy-MM-dd', 'en-US')
                : null,
            endDate: this.projectForm.value.endDate
                ? formatDate(this.projectForm.value.endDate, 'yyyy-MM-dd', 'en-US')
                : null,
            ownerId: this.userId,
        };

        this.projectService
            .createProject(projectData)
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
}
