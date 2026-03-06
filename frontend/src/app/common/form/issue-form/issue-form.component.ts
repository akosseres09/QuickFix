import { CommonModule, Location } from '@angular/common';
import { Component, inject, input, model, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TextEditorComponent } from '../../text-editor/text-editor.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
    Issue,
    IssuePriority,
    IssueStatus,
    IssueType,
    PRIORITIES,
    PRIORITY_COLOR_MAP,
    PRIORITY_MAP,
    STATUS_COLOR_MAP,
    STATUS_LIST,
    STATUS_MAP,
    TYPE_COLOR_MAP,
    TYPE_MAP,
    TYPES,
} from '../../../shared/model/Issue';
import { Claims } from '../../../shared/constants/user/Claims';
import { ProjectMember } from '../../../shared/model/ProjectMember';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { ProjectMemberService } from '../../../shared/services/project-member/project-member.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-issue-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        TextEditorComponent,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        RouterLink,
    ],
    templateUrl: './issue-form.component.html',
    styleUrl: './issue-form.component.css',
})
export class IssueFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);
    private readonly memberService = inject(ProjectMemberService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);
    private readonly location = inject(Location);

    projectId = input.required<string>();
    organizationId = input.required<string>();
    issue = input<Issue | null>(null);
    buttonText = input<string>('Create Issue');
    icon = input<string>('add');

    minDate = signal<Date>(new Date());
    isUsersLoading = signal<boolean>(true);
    pickableUsers = signal<ProjectMember[]>([]);
    private user = signal<Claims | null>(this.authService.currentUserClaims());

    isSubmitting = model<boolean>(false);
    formSubmitted = output<Partial<Issue>>();

    issueForm!: FormGroup;

    readonly typeList = TYPES;
    readonly typeMap = TYPE_MAP;
    readonly typeColorMap = TYPE_COLOR_MAP;

    readonly priorityList = PRIORITIES;
    readonly priorityMap = PRIORITY_MAP;
    readonly priorityColorMap = PRIORITY_COLOR_MAP;

    readonly statusList = STATUS_LIST;
    readonly statusMap = STATUS_MAP;
    readonly statusColorMap = STATUS_COLOR_MAP;

    ngOnInit(): void {
        this.issueForm = this.fb.group({
            title: [this.issue()?.title || '', [Validators.required, Validators.maxLength(255)]],
            description: [this.issue()?.description || ''],
            type: [this.issue()?.type ?? IssueType.TASK, Validators.required],
            status: [this.issue()?.status ?? IssueStatus.OPEN, Validators.required],
            priority: [this.issue()?.priority ?? IssuePriority.MEDIUM, Validators.required],
            assignedTo: [this.issue()?.assignedTo || (null as string | null)],
            dueDate: [
                this.issue()?.dueDate
                    ? new Date(this.issue()!.dueDate! * 1000)
                    : (null as Date | null),
            ],
        });

        this.issueForm.get('assignedTo')?.disable();

        const projectId = this.projectId();
        if (!projectId) {
            this.snackbarService.error('Project ID is missing. Cannot create or edit issue.');
            this.router.navigate(['../'], { relativeTo: this.activeRoute });
            return;
        }

        const organizationId = this.organizationId();
        if (!organizationId) {
            this.snackbarService.error('Organization ID is missing. Cannot create or edit issue.');
            this.router.navigate(['../'], { relativeTo: this.activeRoute });
            return;
        }

        this.memberService
            .getProjectMembers({
                organizationId,
                projectId,
            })
            .pipe(
                finalize(() => {
                    this.isUsersLoading.set(false);
                    this.issueForm.get('assignedTo')?.enable();
                })
            )
            .subscribe({
                next: (response) => {
                    this.pickableUsers.set(response.items);
                },
                error: (error) => {
                    this.snackbarService.error('Failed to load users');
                },
            });
    }

    onSubmit() {
        const projectId = this.projectId();
        const user = this.user();
        if (!projectId || !user) {
            return;
        }

        if (this.issueForm.invalid) {
            this.issueForm.markAllAsTouched();
            this.snackbarService.error('Please fill in all required fields');
            return;
        }

        this.isSubmitting.set(true);
        const formValue = this.issueForm.value;

        // Convert date to timestamp if provided
        const issueData: Partial<Issue> = {
            title: formValue.title || '',
            description: formValue.description || '',
            type: (formValue.type ?? IssueType.BUG) as Issue['type'],
            priority: (formValue.priority ?? IssuePriority.MEDIUM) as Issue['priority'],
            assignedTo: formValue.assignedTo || null,
            dueDate: formValue.dueDate ? new Date(formValue.dueDate).getTime() / 1000 : null,
        };

        this.formSubmitted.emit(issueData);
    }

    onCancel(): void {
        this.location.back();
    }
}
