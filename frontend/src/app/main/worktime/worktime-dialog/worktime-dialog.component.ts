import { Component, effect, inject, input, signal, TemplateRef, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Issue } from '../../../shared/model/Issue';
import { IssueService } from '../../../shared/services/issue/issue.service';

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
    ],
    templateUrl: './worktime-dialog.component.html',
    styleUrl: './worktime-dialog.component.css',
})
export class WorktimeDialogComponent {
    private readonly issueService = inject(IssueService);

    projectId = input<string | null>(null);
    organizationId = input<string | null>(null);

    issues = signal<Issue[]>([]);
    worktimeFormTemplate = viewChild<TemplateRef<unknown>>('worktimeFormTemplate');

    worktimeForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.worktimeForm = this.fb.group({
            issueId: ['', Validators.required],
            loggedAt: [new Date(), Validators.required],
            hours: ['', [Validators.required, Validators.min(0.25), Validators.max(24)]],
            description: ['', [Validators.required, Validators.maxLength(500)]],
        });

        effect(() => {
            const projectId = this.projectId();
            const organizationId = this.organizationId();
            if (projectId && organizationId) {
                this.issueService
                    .getIssuesSimple({ projectId, organizationId, queryParams: { pageSize: 100 } })
                    .subscribe({ next: (issues) => this.issues.set(issues) });
            } else {
                this.issues.set([]);
            }
        });
    }
}
