import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { IssueService } from '../../../shared/services/issue/issue.service';
import {
    Issue,
    IssueType,
    PRIORITY_COLOR_MAP,
    PRIORITY_MAP,
    STATUS_COLOR_MAP,
    STATUS_MAP,
    TYPE_COLOR_MAP,
    TYPE_MAP,
} from '../../../shared/model/Issue';
import { AvatarComponent } from '../../../common/avatar/avatar.component';
import { QuillModule } from 'ngx-quill';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time/relative-time.pipe';
import { GMTPipe } from '../../../shared/pipes/gmt/gmt.pipe';
import { MatButton, MatAnchor } from '@angular/material/button';

@Component({
    selector: 'app-view-issue',
    imports: [
        CommonModule,
        MatIcon,
        MatTooltip,
        AvatarComponent,
        RouterLink,
        DatePipe,
        QuillModule,
        RelativeTimePipe,
        GMTPipe,
        MatTooltipModule,
        MatButton,
        MatAnchor,
    ],
    templateUrl: './view-issue.component.html',
    styleUrl: './view-issue.component.css',
})
export class ViewIssueComponent {
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly issueService = inject(IssueService);

    issueId = signal<string | null>(this.activeRoute.snapshot.paramMap.get('issueId'));
    projectId = signal<string | null>(
        this.activeRoute.parent?.parent?.snapshot.paramMap.get('projectId') || null
    );
    issue = signal<Issue | null>(null);
    loading = signal<boolean>(true);
    descriptionExpanded = signal<boolean>(false);
    showDescriptionExpandButton = computed(() => {
        const issue = this.issue();

        return issue?.description && issue.description.length / 2 > 1000;
    });

    PRIORITY_COLOR_MAP = PRIORITY_COLOR_MAP;
    PRIORITY_MAP = PRIORITY_MAP;
    STATUS_COLOR_MAP = STATUS_COLOR_MAP;
    STATUS_MAP = STATUS_MAP;
    TYPE_COLOR_MAP = TYPE_COLOR_MAP;
    TYPE_MAP = TYPE_MAP;

    constructor() {
        const id = this.issueId();
        const projectId = this.projectId();

        if (!id || !projectId) {
            this.loading.set(false);
            return;
        }
        this.issueService.setProjectId(projectId);
        this.issueService.getIssueById(id).subscribe({
            next: (issue) => {
                this.issue.set(issue);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error fetching issue:', err);
                this.loading.set(false);
            },
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
}
