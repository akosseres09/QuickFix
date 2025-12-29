import { Component, OnInit } from '@angular/core';
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
export class IssuesComponent implements OnInit {
    issues: Array<Issue> = [];
    shownIssues: MatTableDataSource<Issue> = new MatTableDataSource<Issue>();
    displayedColumns: Array<DisplayedColumn> = [
        {
            id: 'id',
            label: '#',
            sortable: false,
            value: (e: Issue) => e.id,
        },
        {
            id: 'title',
            label: 'Title',
            sortable: false,
            value: (e: Issue) => e.title,
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

    constructor(
        private issueService: IssueService,
        private router: Router,
        private snackbarService: SnackbarService
    ) {}

    ngOnInit(): void {
        this.issues = this.issueService.getIssues();
        this.shownIssues.data = this.issues;
    }

    onEdit(issue: Issue) {
        this.snackbarService.open('Navigating to issue ' + issue.id);
        //this.router.navigate(['/issues', issue.id]);
    }

    onDelete(issue: Issue) {
        this.snackbarService.open('Issue deleted');
        // Not implemented
    }
}
