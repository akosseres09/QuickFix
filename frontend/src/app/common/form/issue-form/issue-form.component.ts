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
    IssueType,
    PRIORITIES,
    PRIORITY_COLOR_MAP,
    PRIORITY_MAP,
    TYPE_COLOR_MAP,
    TYPE_MAP,
    TYPES,
} from '../../../shared/model/Issue';
import { Claims } from '../../../shared/constants/user/Claims';
import { ProjectMember } from '../../../shared/model/ProjectMember';
import { RouterLink } from '@angular/router';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { ProjectMemberService } from '../../../shared/services/project-member/project-member.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { LabelService } from '../../../shared/services/label.service';
import { Label } from '../../../shared/model/Label';

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
    private readonly snackbarService = inject(SnackbarService);
    private readonly memberService = inject(ProjectMemberService);
    private readonly authService = inject(AuthService);
    private readonly location = inject(Location);
    private readonly labelService = inject(LabelService);

    projectId = input.required<string>();
    organizationId = input.required<string>();
    issue = input<Issue | null>(null);
    buttonText = input<string>('Create Issue');
    icon = input<string>('add');

    minDate = signal<Date>(new Date());
    isUsersLoading = signal<boolean>(true);
    pickableUsers = signal<ProjectMember[]>([]);
    private user = signal<Claims | null>(this.authService.currentUserClaims());
    isLabelsLoading = signal<boolean>(true);
    labels = signal<Label[]>([]);

    isSubmitting = model<boolean>(false);
    formSubmitted = output<Partial<Issue>>();

    issueForm!: FormGroup;

    selectedLabel = signal<Label | null>(null);

    readonly typeList = TYPES;
    readonly typeMap = TYPE_MAP;
    readonly typeColorMap = TYPE_COLOR_MAP;

    readonly priorityList = PRIORITIES;
    readonly priorityMap = PRIORITY_MAP;
    readonly priorityColorMap = PRIORITY_COLOR_MAP;

    ngOnInit(): void {
        const projectId = this.projectId();
        const organizationId = this.organizationId();

        this.setFormData();
        this.getLabels(organizationId, projectId);
        this.getMembers(organizationId, projectId);
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
            statusLabel: formValue.statusLabel || null,
            dueDate: formValue.dueDate ? new Date(formValue.dueDate).getTime() / 1000 : null,
        };

        this.formSubmitted.emit(issueData);
    }

    onCancel(): void {
        this.location.back();
    }

    private getLabels(organizationId: string, projectId: string) {
        this.labelService
            .getLabelsToProject({
                organizationId: organizationId,
                projectId: projectId,
            })
            .pipe(
                finalize(() => {
                    this.isLabelsLoading.set(false);
                    this.issueForm.get('statusLabel')?.enable();
                })
            )
            .subscribe({
                next: (response) => {
                    this.labels.set(response.items);
                    console.log(this.labels());

                    this.setSelectedLabel();
                },
                error: (_) => {
                    this.snackbarService.error('Failed to load labels');
                },
            });
    }

    private setSelectedLabel() {
        const labels = this.labels();
        const issue = this.issue();

        if (!labels) {
            console.error('Labels or issue data is missing');
            return;
        }

        if (issue?.label?.id) {
            const currentLabel = labels.find((l) => l.id === issue.label?.id);
            if (currentLabel) {
                this.selectedLabel.set(currentLabel);
            }
        } else if (!issue && labels.length > 0) {
            const firstLabel = labels[0];
            this.selectedLabel.set(firstLabel);
            this.issueForm.get('statusLabel')?.setValue(firstLabel.id);
        }
    }

    private setFormData() {
        this.issueForm = this.fb.group({
            title: [this.issue()?.title || '', [Validators.required, Validators.maxLength(255)]],
            description: [this.issue()?.description || ''],
            type: [this.issue()?.type ?? IssueType.TASK, Validators.required],
            statusLabel: [this.issue()?.label?.id || null, Validators.required],
            priority: [this.issue()?.priority ?? IssuePriority.MEDIUM, Validators.required],
            assignedTo: [this.issue()?.assignedTo || (null as string | null)],
            dueDate: [
                this.issue()?.dueDate
                    ? new Date(this.issue()!.dueDate! * 1000)
                    : (null as Date | null),
            ],
        });

        this.issueForm.get('statusLabel')?.valueChanges.subscribe((val) => {
            const label = this.labels().find((l) => l.id === val);
            this.selectedLabel.set(label || null);
        });

        this.issueForm.get('assignedTo')?.disable();
        this.issueForm.get('statusLabel')?.disable();
    }

    private getMembers(organizationId: string, projectId: string) {
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
                error: (_) => {
                    this.snackbarService.error('Failed to load users');
                },
            });
    }
}
