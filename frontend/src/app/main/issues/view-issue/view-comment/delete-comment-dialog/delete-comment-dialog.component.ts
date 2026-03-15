import { Component, inject, input, output, TemplateRef, viewChild } from '@angular/core';
import { DialogService } from '../../../../../shared/services/dialog/dialog.service';
import { IssueCommentService } from '../../../../../shared/services/issue-comment/issue-comment.service';
import { SnackbarService } from '../../../../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-delete-comment-dialog',
    imports: [],
    templateUrl: './delete-comment-dialog.component.html',
    styleUrl: './delete-comment-dialog.component.css',
})
export class DeleteCommentDialogComponent {
    private readonly dialogService = inject(DialogService);
    private readonly commentService = inject(IssueCommentService);
    private readonly snackbarService = inject(SnackbarService);

    organizationId = input.required<string>();
    projectId = input.required<string>();
    issueId = input.required<string>();

    template = viewChild<TemplateRef<any>>('deleteConfirmTemplate');
    commentDeleted = output<string>();

    open(commentId: string) {
        const template = this.template();
        const orgId = this.organizationId();
        const projectId = this.projectId();
        const issueId = this.issueId();

        if (!template || !orgId || !projectId || !issueId) return;

        const dialogRef = this.dialogService.openFormDialog('Delete Comment', template, {
            saveLabel: 'Delete',
            width: '600px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.action === 'save') {
                this.deleteComment({
                    organizationId: this.organizationId(),
                    projectId: this.projectId(),
                    issueId: this.issueId(),
                    commentId: commentId,
                });
            }
        });
    }

    private deleteComment(ids: {
        organizationId: string;
        projectId: string;
        issueId: string;
        commentId: string;
    }) {
        this.commentService.deleteComment(ids).subscribe({
            next: () => {
                this.snackbarService.success('Comment deleted successfully');
                this.commentDeleted.emit(ids.commentId);
            },
            error: (error) => {
                console.error('Failed to delete comment', error);
                this.snackbarService.error('Failed to delete comment');
            },
        });
    }
}
