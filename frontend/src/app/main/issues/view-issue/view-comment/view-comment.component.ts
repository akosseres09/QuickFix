import { Component, inject, input, OnInit, signal } from '@angular/core';
import { IssueCommentService } from '../../../../shared/services/issue-comment/issue-comment.service';
import { IssueComment } from '../../../../shared/model/IssueComment';
import { AvatarComponent } from '../../../../common/avatar/avatar.component';
import { QuillModule } from 'ngx-quill';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-view-comment',
    imports: [AvatarComponent, QuillModule, CommonModule],
    templateUrl: './view-comment.component.html',
    styleUrl: './view-comment.component.css',
})
export class ViewCommentComponent implements OnInit {
    private readonly issueCommentService = inject(IssueCommentService);

    issueId = input.required<string>();
    projectId = input.required<string>();

    comments = signal<IssueComment[]>([]);

    ngOnInit(): void {
        this.issueCommentService
            .getCommentsToIssue({
                projectId: this.projectId(),
                issueId: this.issueId(),
                expand: 'creator,updator',
            })
            .subscribe({
                next: (result) => {
                    this.comments.set(result.items);
                },
                error: (error) => {
                    console.error(error);
                },
            });
    }
}
