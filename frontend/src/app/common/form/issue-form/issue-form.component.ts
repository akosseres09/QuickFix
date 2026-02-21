import { CommonModule } from '@angular/common';
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
import { Claims } from '../../../shared/constants/user/Claims';
import { ProjectMember } from '../../../shared/model/ProjectMember';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { ProjectMemberService } from '../../../shared/services/project-member/project-member.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

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

    projectId = input<string>('');
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
    readonly priorityList = PRIORITIES;
    readonly statusList = STATUS_LIST;
    readonly typeMap = TYPE_MAP;
    readonly priorityMap = PRIORITY_MAP;
    readonly typeColorMap = TYPE_COLOR_MAP;
    readonly priorityColorMap = PRIORITY_COLOR_MAP;

    ngOnInit(): void {
        this.issueForm = this.fb.group({
            title: [this.issue()?.title || '', [Validators.required, Validators.maxLength(255)]],
            description: [this.issue()?.description || '', [Validators.maxLength(5000)]],
            type: [this.issue()?.type || TYPE_BUG, Validators.required],
            priority: [this.issue()?.priority || PRIORITY_MEDIUM, Validators.required],
            assignedTo: [this.issue()?.assignedTo || (null as string | null)],
            dueDate: [
                this.issue()?.dueDate
                    ? new Date(this.issue()!.dueDate! * 1000)
                    : (null as Date | null),
            ],
        });

        if (!this.projectId()) {
            this.snackbarService.open('Project ID is missing. Cannot create issue.', [
                'snackbar-error',
            ]);
            this.router.navigate(['../'], { relativeTo: this.activeRoute });
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

    onSubmit() {
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

        this.isSubmitting.set(true);
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

        this.formSubmitted.emit(issueData);
    }

    onCancel(): void {
        this.router.navigate(['/project', this.projectId(), 'issues']);
    }
}
