import { Component, computed, inject, signal } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Issue } from '../../shared/model/Issue';
import { IssueService } from '../../shared/services/issue/issue.service';
import { CommonModule } from '@angular/common';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { TableComponent } from '../../common/table/table.component';
import { Router } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-issues',
    imports: [MatTableModule, MatPaginatorModule, CommonModule, TableComponent],
    templateUrl: './issues.component.html',
    styleUrl: './issues.component.css',
})
export class IssuesComponent {
    private snackbarService = inject(SnackbarService);
    private issueService = inject(IssueService);
    private router = inject(Router);

    issues = signal<Issue[]>(this.issueService.getIssues());
    shownIssues = computed(() => new MatTableDataSource<Issue>(this.issues()));
    displayedColumns: Array<DisplayedColumn<Issue>> = [
        {
            id: 'id',
            label: '#',
            sortable: false,
            value: (e: Issue) => e.id,
            routerLink: (e: Issue) => ['/issues', e.id],
        },
        {
            id: 'title',
            label: 'Title',
            sortable: false,
            value: (e: Issue) => e.title,
            routerLink: (e: Issue) => ['/issues', e.id],
        },
        {
            id: 'project',
            label: 'Project',
            sortable: false,
            value: (e: Issue) => e.project,
        },
        {
            id: 'createdAt',
            label: 'Created At',
            sortable: true,
            value: (e: Issue) => e.createdAt,
        },
        {
            id: 'author',
            label: 'Author',
            sortable: false,
            value: (e: Issue) => e.author.username,
        },

        {
            id: 'assignee',
            label: 'Assignee',
            sortable: false,
            value: (e: Issue) => (e.assignee ? e.assignee.username : ''),
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            value: (e: Issue) =>
                (e.status.charAt(0).toUpperCase() + e.status.slice(1)).replaceAll('_', ' '),
        },
    ];

    onEdit(issue: Issue) {
        this.snackbarService.open('Navigating to issue ' + issue.id);
        //this.router.navigate(['/issues', issue.id]);
    }

    onDelete(issue: Issue) {
        this.snackbarService.open('Issue deleted');
        // Not implemented
    }
}
