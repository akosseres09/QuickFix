import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
export class ViewIssueComponent {
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly issueService = inject(IssueService);

    issueId = signal<string | null>(this.activeRoute.snapshot.paramMap.get('issueId'));
    projectId = signal<string | null>(
        this.activeRoute.parent?.parent?.snapshot.paramMap.get('projectId') || null
    );
    issue = signal<Issue | null>(null);
    loading = signal<boolean>(true);

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
}
