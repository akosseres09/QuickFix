import {
    Component,
    DestroyRef,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Issue } from '../../../shared/model/Issue';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { ApiQueryParams } from '../../../shared/constants/api/ApiQueryParams';
import { DialogService } from '../../../shared/services/dialog/dialog.service';
import { WorktimeService } from '../../../shared/services/worktime/worktime.service';
import { DateService } from '../../../shared/services/date/date.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { Worktime } from '../../../shared/model/Worktime';

@Component({
    selector: 'app-worktime-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatAutocomplete,
        MatAutocompleteTrigger,
    ],
    templateUrl: './worktime-dialog.component.html',
    styleUrl: './worktime-dialog.component.css',
})
export class WorktimeDialogComponent {
    private readonly issueService = inject(IssueService);
    private readonly dialogService = inject(DialogService);
    private readonly worktimeService = inject(WorktimeService);
    private readonly dateService = inject(DateService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly destroyRef = inject(DestroyRef);

    projectId = input<string | null>(null);
    organizationId = input<string | null>(null);
    worktimeSaved = output<Worktime>();

    issues = signal<Issue[]>([]);
    worktimeFormTemplate = viewChild<TemplateRef<unknown>>('worktimeFormTemplate');
    selectedIssue = signal<Issue | null>(null);

    worktimeForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.worktimeForm = this.fb.group({
            issue: ['', Validators.required],
            loggedAt: [new Date(), Validators.required],
            hours: ['', [Validators.required, Validators.min(0.25), Validators.max(24)]],
            description: ['', [Validators.required, Validators.maxLength(500)]],
        });

        this.worktimeForm
            .get('issue')
            ?.valueChanges.pipe(takeUntilDestroyed(), debounceTime(300))
            .subscribe((value) => {
                this.loadIssues(value);
            });
    }

    open(): void {
        const template = this.worktimeFormTemplate();
        const orgId = this.organizationId();
        if (!template || !orgId) return;

        const dialogRef = this.dialogService.openFormDialog(
            'Add Worktime',
            template as TemplateRef<any>,
            {
                saveLabel: 'Save',
                cancelLabel: 'Cancel',
                saveDisabled: this.worktimeForm.invalid,
                width: '600px',
                saveButtonClass: '',
            }
        );

        this.worktimeForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            if (dialogRef.componentInstance) {
                dialogRef.componentInstance.data.saveDisabled = this.worktimeForm.invalid;
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'save' && this.worktimeForm.valid) {
                const { issue, loggedAt, hours, description } = this.worktimeForm.value;
                const issueId = typeof issue === 'object' ? issue?.id : issue;

                this.worktimeService
                    .createWorktime(orgId, {
                        issue_id: issueId,
                        minutes_spent: Math.round(parseFloat(hours) * 60),
                        logged_at: this.dateService.toLocaleISOString(new Date(loggedAt), true),
                        description: description ?? '',
                    })
                    .subscribe({
                        next: (created) => {
                            this.worktimeSaved.emit(created);
                            this.snackbarService.success('Worktime entry saved.');
                        },
                        error: () => this.snackbarService.error('Failed to save worktime entry.'),
                    });
            }
            this.worktimeForm.reset({ loggedAt: new Date() });
        });
    }

    displayFn(issue: Issue | string | null): string {
        if (!issue) return '';
        if (typeof issue === 'string') return issue;
        return `#${issue.issueKey} — ${issue.title}`;
    }

    onIssueChange(issue: Issue) {
        this.selectedIssue.set(issue);
    }

    private loadIssues(name: string) {
        const projectId = this.projectId();
        const organizationId = this.organizationId();
        if (!projectId || !organizationId) {
            this.issues.set([]);
            return;
        }

        const params: ApiQueryParams = {
            title: name,
        };

        this.issueService
            .getIssues(
                {
                    organizationId,
                    projectId,
                },
                params
            )
            .subscribe({
                next: (response) => {
                    this.issues.set(response.items);
                },
                error: (error) => {
                    console.error('Failed to load issues:', error);
                    this.issues.set([]);
                },
            });
    }
}
