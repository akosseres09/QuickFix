import { Component, computed, inject, input, model, signal } from '@angular/core';
import {
    Issue,
    IssueStatus,
    IssueType,
    PRIORITY_COLOR_MAP,
    PRIORITY_MAP,
    STATUS_COLOR_MAP,
    STATUS_MAP,
    TYPE_COLOR_MAP,
    TYPE_MAP,
} from '../../../../shared/model/Issue';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time/relative-time.pipe';
import { GMTPipe } from '../../../../shared/pipes/gmt/gmt.pipe';
import { QuillModule } from 'ngx-quill';
import { MatIconModule } from '@angular/material/icon';
import { AvatarComponent } from '../../../../common/avatar/avatar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { IssueService } from '../../../../shared/services/issue/issue.service';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';
import { TextEditorComponent } from '../../../../common/text-editor/text-editor.component';
import { ViewCommentComponent } from '../view-comment/view-comment.component';
import { IssueCommentService } from '../../../../shared/services/issue-comment/issue-comment.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { IssueComment } from '../../../../shared/model/IssueComment';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-view',
    imports: [
        ReactiveFormsModule,
        CommonModule,
        MatTooltipModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatFormFieldModule,
        AvatarComponent,
        QuillModule,
        RouterLink,
        RelativeTimePipe,
        GMTPipe,
        TextEditorComponent,
        ViewCommentComponent,
    ],
    templateUrl: './view.component.html',
    styleUrl: './view.component.css',
})
export class ViewComponent {
    private readonly issueService = inject(IssueService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly issueCommentService = inject(IssueCommentService);
    private readonly fb = inject(FormBuilder);

    // inputs
    issueId = input.required<string>();
    projectId = input.required<string>();
    issue = model.required<Issue>();

    // signals
    descriptionExpanded = signal<boolean>(false);
    showDescriptionExpandButton = computed(() => {
        const issue = this.issue();
        return issue?.description && issue.description.length / 2 > 1000;
    });

    // from

    commentForm = this.fb.group({
        content: ['', [Validators.required, Validators.maxLength(15000)]],
    });

    // constants
    issueStatuses = IssueStatus;
    PRIORITY_COLOR_MAP = PRIORITY_COLOR_MAP;
    PRIORITY_MAP = PRIORITY_MAP;
    STATUS_COLOR_MAP = STATUS_COLOR_MAP;
    STATUS_MAP = STATUS_MAP;
    TYPE_COLOR_MAP = TYPE_COLOR_MAP;
    TYPE_MAP = TYPE_MAP;

    getTypeIcon(): string {
        const issue = this.issue();
        if (!issue) return 'help_outline';
        switch (issue.type) {
            case IssueType.BUG:
                return 'bug_report';
            case IssueType.FEATURE:
                return 'star';
            case IssueType.TASK:
                return 'task_alt';
            case IssueType.INCIDENT:
                return 'warning';
            default:
                return 'help_outline';
        }
    }

    isOverdue(): boolean {
        const issue = this.issue();
        if (!issue?.dueDate) return false;
        return issue.dueDate * 1000 < Date.now() && issue.status < 3;
    }

    updateIssueStatus(status: IssueStatus): void {
        this.issueService
            .updateIssue(this.issue().id, {
                status: status,
                closedAt: status === IssueStatus.CLOSED ? Math.floor(Date.now() / 1000) : null,
            })
            .subscribe({
                next: (updatedIssue) => {
                    this.issue.set({
                        ...this.issue(),
                        ...updatedIssue,
                    });
                    this.snackbarService.open('Issue status updated successfully');
                },
                error: (err) => {
                    console.error('Failed to update issue status:', err);
                    this.snackbarService.open('Failed to update issue status', ['snackbar-error']);
                },
            });
    }

    copyIssueId(): void {
        const issue = this.issue();
        if (!issue) return;

        navigator.clipboard.writeText(issue.id).then(
            () => {
                this.snackbarService.open('Issue ID copied to clipboard');
            },
            (err) => {
                console.error('Failed to copy issue ID:', err);
                this.snackbarService.open('Failed to copy issue ID', ['snackbar-error']);
            }
        );
    }

    copyIssueLink(): void {
        const issue = this.issue();
        if (!issue) return;

        navigator.clipboard.writeText(window.location.href).then(
            () => {
                this.snackbarService.open('Issue link copied to clipboard');
            },
            (err) => {
                console.error('Failed to copy issue link:', err);
                this.snackbarService.open('Failed to copy issue link', ['snackbar-error']);
            }
        );
    }

    createComment() {
        if (this.commentForm.invalid) {
            this.commentForm.markAllAsTouched();
            return;
        }

        const newComment: Partial<IssueComment> = {
            content: this.comment.value as string,
        };
        this.issueCommentService
            .createComment({
                projectId: this.projectId(),
                issueId: this.issueId(),
                data: newComment,
            })
            .pipe(
                finalize(() => {
                    this.commentForm.reset();
                    this.commentForm.markAsUntouched();
                })
            )
            .subscribe({
                next: (result) => {
                    console.log(result);
                },
                error: (error) => {
                    this.snackbarService.open('Failed to add comment!', ['snackbar-error']);
                },
            });
    }

    get creatorName(): string {
        const issue = this.issue();
        if (!issue) return 'Unknown';

        const creator = issue.creator;

        if (!creator) return 'Unknown';

        const { firstName, lastName } = creator;

        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        }

        return creator.username;
    }

    get updatorName(): string {
        const issue = this.issue();
        if (!issue) return 'Unknown';

        const updator = issue.updator;
        if (!updator) return 'Unknown';

        const { firstName, lastName } = updator;

        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        }

        return updator.username;
    }

    get comment() {
        return this.commentForm.get('content')!;
    }
}
