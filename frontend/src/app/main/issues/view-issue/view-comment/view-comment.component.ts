import { Component, inject, input, OnInit, signal } from '@angular/core';
import { IssueCommentService } from '../../../../shared/services/issue-comment/issue-comment.service';
import { IssueComment } from '../../../../shared/model/IssueComment';
import { AvatarComponent } from '../../../../common/avatar/avatar.component';
import { QuillModule } from 'ngx-quill';
import { CommonModule } from '@angular/common';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time/relative-time.pipe';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GMTPipe } from '../../../../shared/pipes/gmt/gmt.pipe';
import { MatButton } from '@angular/material/button';

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
    ],
    templateUrl: './view-comment.component.html',
    styleUrl: './view-comment.component.css',
})
export class ViewCommentComponent implements OnInit {
    private readonly issueCommentService = inject(IssueCommentService);

    issueId = input.required<string>();
    projectId = input.required<string>();

    comments = signal<IssueComment[]>([]);
    nextCursor = signal<string | null>(null);
    hasMore = signal<boolean>(false);
    isLoading = signal<boolean>(false);

    ngOnInit(): void {
        this.loadComments();
    }

    loadComments(cursor?: string): void {
        this.isLoading.set(true);
        this.issueCommentService
            .getCommentsToIssue({
                projectId: this.projectId(),
                issueId: this.issueId(),
                expand: 'creator,updator',
                cursor,
            })
            .subscribe({
                next: (result) => {
                    if (cursor) {
                        this.comments.update((current) => [...current, ...result.items]);
                    } else {
                        this.comments.set(result.items);
                    }
                    this.nextCursor.set(result.nextCursor);
                    this.hasMore.set(result.hasMore);
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error(error);
                    this.isLoading.set(false);
                },
            });
    }

    loadMore(): void {
        const cursor = this.nextCursor();
        if (cursor && !this.isLoading()) {
            this.loadComments(cursor);
        }
    }
}
