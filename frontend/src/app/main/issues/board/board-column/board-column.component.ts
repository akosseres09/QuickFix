import { Component, input, linkedSignal, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDragDrop, CdkDragEnter, CdkDragExit } from '@angular/cdk/drag-drop';
import { Issue } from '../../../../shared/model/Issue';
import { IssueCardComponent } from '../issue-card/issue-card.component';

@Component({
    selector: 'app-board-column',
    imports: [CommonModule, CdkDropList, IssueCardComponent],
    templateUrl: './board-column.component.html',
    styleUrl: './board-column.component.css',
})
export class BoardColumnComponent {
    organizationId = input.required<string>();
    columnTitle = input.required<string>();
    issues = input.required<Issue[]>();
    status = input.required<number>();
    issueClick = output<Issue>();
    dropEvent = output<CdkDragDrop<Issue[]>>();
    showEmptyText = linkedSignal<boolean>(() => this.issues().length <= 0);

    get dropListId(): string {
        return `status-${this.status()}`;
    }

    onIssueClick(issue: Issue) {
        this.issueClick.emit(issue);
    }

    onDrop(event: CdkDragDrop<Issue[]>) {
        this.dropEvent.emit(event);
    }

    onDropListEntered(event: CdkDragEnter) {
        this.showEmptyText.set(false);
    }

    onDropListExited(event: CdkDragExit) {
        const isOwnItem = this.issues().some((i) => i.id === event.item.data?.id);

        if (!isOwnItem || this.issues().length > 1) return;
        this.showEmptyText.set(true);
    }
}
