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
    ],
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
