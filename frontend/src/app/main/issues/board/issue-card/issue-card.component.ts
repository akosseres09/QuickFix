import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { CdkDrag } from '@angular/cdk/drag-drop';
import {
    Issue,
    PRIORITY_COLOR_MAP,
    PRIORITY_MAP,
    TYPE_COLOR_MAP,
    TYPE_MAP,
    IssueType,
} from '../../../../shared/model/Issue';
import { AvatarComponent } from '../../../../common/avatar/avatar.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-issue-card',
    imports: [CommonModule, MatCard, MatIcon, CdkDrag, AvatarComponent, RouterLink],
    templateUrl: './issue-card.component.html',
    styleUrl: './issue-card.component.css',
})
export class IssueCardComponent {
    organizationId = input.required<string>();
    issue = input.required<Issue>();
    cardClick = output<Issue>();

    PRIORITY_COLOR_MAP = PRIORITY_COLOR_MAP;
    PRIORITY_MAP = PRIORITY_MAP;
    TYPE_COLOR_MAP = TYPE_COLOR_MAP;
    TYPE_MAP = TYPE_MAP;

    onCardClick() {
        this.cardClick.emit(this.issue());
    }

    getTypeIcon(): string {
        switch (this.issue().type) {
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
}
