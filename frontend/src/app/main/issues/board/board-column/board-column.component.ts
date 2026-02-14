import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Issue } from '../../../../shared/model/Issue';
import { IssueCardComponent } from '../issue-card/issue-card.component';

@Component({
    selector: 'app-board-column',
    imports: [CommonModule, CdkDropList, IssueCardComponent],
    templateUrl: './board-column.component.html',
    styleUrl: './board-column.component.css',
})
export class BoardColumnComponent {
    columnTitle = input.required<string>();
    issues = input.required<Issue[]>();
    status = input.required<number>();
    connectedLists = input<string[]>([]);
    issueClick = output<Issue>();
    dropEvent = output<CdkDragDrop<Issue[]>>();

    get dropListId(): string {
        return `status-${this.status}`;
    }

    onIssueClick(issue: Issue) {
        this.issueClick.emit(issue);
    }

    onDrop(event: CdkDragDrop<Issue[]>) {
        this.dropEvent.emit(event);
    }
}
