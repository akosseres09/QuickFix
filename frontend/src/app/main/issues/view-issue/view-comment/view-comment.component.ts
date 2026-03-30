import {
    Component,
    DestroyRef,
    inject,
    input,
    OnInit,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { IssueCommentService } from '../../../../shared/services/issue-comment/issue-comment.service';
import { IssueComment } from '../../../../shared/model/IssueComment';
import { AvatarComponent } from '../../../../common/avatar/avatar.component';
import { QuillModule } from 'ngx-quill';
import { CommonModule } from '@angular/common';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time/relative-time.pipe';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GMTPipe } from '../../../../shared/pipes/gmt/gmt.pipe';
import { MatButton, MatButtonModule, MatMiniFabButton } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { MatIcon } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { DeleteCommentDialogComponent } from './delete-comment-dialog/delete-comment-dialog.component';
import { CommentPermissions } from '../../../../shared/constants/user/Permissions';

@Component({
    selector: 'app-view-comment',
    imports: [
        AvatarComponent,
        QuillModule,
        CommonModule,
        RouterLink,
        MatTooltipModule,
        RelativeTimePipe,
        GMTPipe,
        MatButton,
        MatIcon,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatMiniFabButton,
        MatButtonModule,
        DeleteCommentDialogComponent,
    ],
    templateUrl: './view-comment.component.html',
    styleUrl: './view-comment.component.css',
})
export class ViewCommentComponent implements OnInit {
    private readonly issueCommentService = inject(IssueCommentService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly snackbarSerivce = inject(SnackbarService);
    private readonly authService = inject(AuthService);

    issueId = input.required<string>();
    projectId = input.required<string>();
    organizationId = input.required<string>();

    editingComment = output<IssueComment>();

    comments = signal<IssueComment[]>([]);
    nextCursor = signal<string | null>(null);
    hasMore = signal<boolean>(false);
    isLoading = signal<boolean>(false);

    currentUser = this.authService.currentClaimsWithPermissions;
    deleteDialog = viewChild(DeleteCommentDialogComponent);

    canEditComment(comment: IssueComment): boolean {
        const user = this.currentUser();
        if (!user) return false;
        return comment.createdBy === user.uid;
    }

    canDeleteComment(comment: IssueComment): boolean {
        const user = this.currentUser();
        if (!user) return false;
        if (comment.createdBy === user.uid) return true;
        return user.canDo(CommentPermissions.DELETE_ANY, {
            projectId: this.projectId(),
            orgId: this.organizationId(),
        });
    }

    constructor() {
        this.issueCommentService.commentUpdated$.pipe(takeUntilDestroyed()).subscribe({
            next: () => {
                this.loadComments();
            },
        });
    }

    ngOnInit(): void {
        this.loadComments();

        this.issueCommentService.commentCreated$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (comment) => {
                    if (!this.hasMore()) {
                        this.comments.update((current) => [...current, comment]);
                        this.nextCursor.set(comment.id);
                    }
                    this.snackbarSerivce.success('Comment added!');
                },
                error: (error) => {
                    console.error('Error in updating UI', error);
                    this.snackbarSerivce.error('Failed to add comment!');
                },
            });
    }

    loadComments(cursor?: string): void {
        this.isLoading.set(true);
        this.issueCommentService
            .getCommentsToIssue({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
                issueId: this.issueId(),
                expand: 'creator',
                cursor,
            })
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                })
            )
            .subscribe({
                next: (result) => {
                    if (cursor) {
                        this.comments.update((current) => [...current, ...result.items]);
                    } else {
                        this.comments.set(result.items);
                    }
                    this.nextCursor.set(result.nextCursor);
                    this.hasMore.set(result.hasMore);
                },
                error: (error) => {
                    console.error(error);
                    this.snackbarSerivce.error('Failed to load comments!');
                },
            });
    }

    loadMore(): void {
        const cursor = this.nextCursor();
        if (cursor && !this.isLoading()) {
            this.loadComments(cursor);
        }
    }

    editComment(comment: IssueComment) {
        this.editingComment.emit(comment);
    }

    openDeleteCommentDialog(comment: IssueComment) {
        this.deleteDialog()?.open(comment.id);
    }

    onCommentDeleted(commentId: string) {
        this.comments.update((current) => current.filter((c) => c.id !== commentId));
    }
}
