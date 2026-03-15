import {
    Component,
    computed,
    effect,
    inject,
    input,
    model,
    signal,
    viewChild,
} from '@angular/core';
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { WorktimeDialogComponent } from '../../../worktime/worktime-dialog/worktime-dialog.component';

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
        WorktimeDialogComponent,
    ],
    templateUrl: './view.component.html',
    styleUrl: './view.component.css',
})
export class ViewComponent {
    private readonly issueService = inject(IssueService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly issueCommentService = inject(IssueCommentService);
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly activeRoute = inject(ActivatedRoute);

    // inputs
    issueId = input.required<string>();
    projectId = input.required<string>();
    organizationId = input.required<string>();

    issue = model.required<Issue>();
    editingComment = signal<IssueComment | null>(null);

    // signals
    descriptionExpanded = signal<boolean>(false);
    showDescriptionExpandButton = computed(() => {
        const issue = this.issue();
        return issue?.description && issue.description.length / 2 > 1000;
    });

    commentForm = this.fb.group({
        commentId: [''],
        content: ['', [Validators.required, Validators.maxLength(15000)]],
    });

    worktimeDialog = viewChild(WorktimeDialogComponent);

    // constants
    issueStatuses = IssueStatus;
    PRIORITY_COLOR_MAP = PRIORITY_COLOR_MAP;
    PRIORITY_MAP = PRIORITY_MAP;
    STATUS_COLOR_MAP = STATUS_COLOR_MAP;
    STATUS_MAP = STATUS_MAP;
    TYPE_COLOR_MAP = TYPE_COLOR_MAP;
    TYPE_MAP = TYPE_MAP;

    constructor() {
        effect(() => {
            const comment = this.editingComment();

            const content = this.commentForm.get('content')!;
            const id = this.commentForm.get('commentId')!;

            if (!comment) {
                content.setValue(null);
                id.setValue(null);
            } else {
                content.setValue(comment.content);
                id.setValue(comment.id);
            }
        });
    }

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
            .updateIssue({
                issueId: this.issue().id,
                projectId: this.projectId(),
                organizationId: this.organizationId(),
                issue: {
                    status: status,
                    closedAt: status === IssueStatus.CLOSED ? Math.floor(Date.now() / 1000) : null,
                },
            })
            .subscribe({
                next: (updatedIssue) => {
                    this.issue.set({
                        ...this.issue(),
                        ...updatedIssue,
                    });
                    this.snackbarService.success('Issue status updated successfully');
                },
                error: (err) => {
                    console.error('Failed to update issue status:', err);
                    this.snackbarService.error('Failed to update issue status');
                },
            });
    }

    copyIssueId(): void {
        const issue = this.issue();
        if (!issue) return;

        navigator.clipboard.writeText(issue.id).then(
            () => {
                this.snackbarService.success('Issue ID copied to clipboard');
            },
            (err) => {
                console.error('Failed to copy issue ID:', err);
                this.snackbarService.error('Failed to copy issue ID');
            }
        );
    }

    copyIssueLink(): void {
        const issue = this.issue();
        if (!issue) return;

        navigator.clipboard.writeText(window.location.href).then(
            () => {
                this.snackbarService.success('Issue link copied to clipboard');
            },
            (err) => {
                console.error('Failed to copy issue link:', err);
                this.snackbarService.error('Failed to copy issue link');
            }
        );
    }

    openWorktimeDialog(): void {
        this.worktimeDialog()?.open();
    }

    onSubmit() {
        if (this.commentForm.invalid) {
            this.commentForm.markAllAsTouched();
            return;
        }

        const commentId = this.commentForm.get('commentId')?.value;

        if (commentId && commentId.trim()) {
            this.editIssue();
        } else {
            this.createIssue();
        }
    }

    private editIssue() {
        const content = this.comment.value;
        const commentId = this.commentId.value;

        if (!content || !commentId) return;

        const editContent: Partial<IssueComment> = {
            content: this.comment.value as string,
        };

        this.issueCommentService
            .editComment({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
                issueId: this.issueId(),
                data: editContent,
                expand: 'creator,updator',
                commentId: commentId,
            })
            .subscribe({
                next: (result) => {
                    this.editingComment.set(null);
                },
                error: (error) => {
                    console.error(error);
                    this.snackbarService.error('Failed to edit comment!');
                },
            });
    }

    private createIssue() {
        const newComment: Partial<IssueComment> = {
            content: this.comment.value as string,
        };

        this.issueCommentService
            .createComment({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
                issueId: this.issueId(),
                data: newComment,
                expand: 'creator,updator',
            })
            .pipe(
                finalize(() => {
                    this.commentForm.reset();
                    this.commentForm.markAsUntouched();
                    this.commentForm.markAsPristine();
                })
            )
            .subscribe({
                next: (result) => {},
                error: (error) => {
                    this.snackbarService.error('Failed to add comment!');
                },
            });
    }

    onCommentEdit(comment: IssueComment | null) {
        this.editingComment.set(comment);
        this.router.navigate(['.'], { fragment: 'text-editor', relativeTo: this.activeRoute });
    }

    onCommentEditCancel() {
        this.editingComment.set(null);
    }

    get comment() {
        return this.commentForm.get('content')!;
    }

    get commentId() {
        return this.commentForm.get('commentId')!;
    }
}
