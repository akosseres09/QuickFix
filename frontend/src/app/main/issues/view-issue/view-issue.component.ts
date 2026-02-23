import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { IssueService } from '../../../shared/services/issue/issue.service';
import { Issue } from '../../../shared/model/Issue';
import { ViewComponent } from './view/view.component';

@Component({
    selector: 'app-view-issue',
    imports: [CommonModule, MatIcon, ViewComponent],
    templateUrl: './view-issue.component.html',
    styleUrl: './view-issue.component.css',
})
export class ViewIssueComponent implements OnInit {
    private readonly issueService = inject(IssueService);

    // angular automatically binds the URL parameters to these signals
    issueId = input.required<string>();
    projectId = input.required<string>();

    issue = signal<Issue | null>(null);
    loading = signal<boolean>(true);

    ngOnInit() {
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
}
