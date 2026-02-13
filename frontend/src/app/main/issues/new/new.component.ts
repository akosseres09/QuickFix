import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    Issue,
    PRIORITIES,
    PRIORITY_COLOR_MAP,
    PRIORITY_MAP,
    PRIORITY_MEDIUM,
    STATUS_LIST,
    TYPE_BUG,
    TYPE_COLOR_MAP,
    TYPE_MAP,
    TYPES,
} from '../../../shared/model/Issue';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectMemberService } from '../../../shared/services/project-member/project-member.service';
import { ProjectMember } from '../../../shared/model/ProjectMember';
import { Claims } from '../../../shared/constants/Claims';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { TextEditorComponent } from '../../../common/text-editor/text-editor.component';

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
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        TextEditorComponent,
    ],
    templateUrl: './new.component.html',
    styleUrl: './new.component.css',
})
export class NewComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);
    private readonly issueService = inject(IssueService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly memberService = inject(ProjectMemberService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);

    readonly typeList = TYPES;
    readonly priorityList = PRIORITIES;
    readonly statusList = STATUS_LIST;
    readonly typeMap = TYPE_MAP;
    readonly priorityMap = PRIORITY_MAP;
    readonly typeColorMap = TYPE_COLOR_MAP;
    readonly priorityColorMap = PRIORITY_COLOR_MAP;

    projectId = signal<string>('');
    isSubmitting = false;
    minDate = signal<Date>(new Date());
    isUsersLoading = signal<boolean>(true);
    pickableUsers = signal<ProjectMember[]>([]);
    private user = signal<Claims | null>(this.authService.currentUserClaims());

    issueForm = this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(255)]],
        description: ['', [Validators.maxLength(5000)]],
        type: [TYPE_BUG, Validators.required],
        priority: [PRIORITY_MEDIUM, Validators.required],
        assignedTo: [null as string | null],
        dueDate: [null as Date | null],
    });

    ngOnInit(): void {
        this.projectId.set(this.activeRoute.snapshot.parent?.parent?.params['projectId'] || '');

        if (!this.projectId()) {
            this.snackbarService.open('Project ID is missing. Cannot create issue.', [
                'snackbar-error',
            ]);
            this.router.navigate(['/issues']);
            return;
        }
        this.memberService.getProjectMembers(this.projectId()).subscribe({
            next: (response) => {
                this.pickableUsers.set(response.items);
                this.isUsersLoading.set(false);
            },
            error: (error) => {
                this.snackbarService.open('Failed to load users', ['snackbar-error']);
                this.isUsersLoading.set(false);
            },
        });
    }

    onSubmit(): void {
        const projectId = this.projectId();
        const user = this.user();
        if (!projectId || !user) {
            return;
        }

        if (this.issueForm.invalid) {
            this.issueForm.markAllAsTouched();
            this.snackbarService.open('Please fill in all required fields', ['snackbar-error']);
            return;
        }

        this.isSubmitting = true;
        const formValue = this.issueForm.value;

        // Convert date to timestamp if provided
        const issueData: Partial<Issue> = {
            title: formValue.title || '',
            description: formValue.description || '',
            type: (formValue.type ?? TYPE_BUG) as Issue['type'],
            priority: (formValue.priority ?? PRIORITY_MEDIUM) as Issue['priority'],
            assignedTo: formValue.assignedTo || null,
            dueDate: formValue.dueDate ? new Date(formValue.dueDate).getTime() / 1000 : null,
        };

        this.issueService
            .createIssue(issueData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (issue) => {
                    this.snackbarService.open(`Issue "${issue.title}" created successfully!`);
                    this.router.navigate(['/project', projectId, 'issues']);
                },
                error: (error) => {
                    this.isSubmitting = false;
                    this.snackbarService.open(
                        error?.error?.message || 'Failed to create issue. Please try again.',
                        ['snackbar-error']
                    );
                },
            });
    }

    onCancel(): void {
        this.router.navigate(['/project', this.projectId(), 'issues']);
    }
}
