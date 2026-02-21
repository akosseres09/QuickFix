import { Component, computed, input, signal } from '@angular/core';
import {
    Issue,
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

@Component({
    selector: 'app-view',
    imports: [
        CommonModule,
        MatTooltipModule,
        MatIconModule,
        MatButtonModule,
        AvatarComponent,
        QuillModule,
        RouterLink,
        RelativeTimePipe,
        GMTPipe,
    ],
    templateUrl: './view.component.html',
    styleUrl: './view.component.css',
})
export class ViewComponent {
    issue = input.required<Issue>();
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
