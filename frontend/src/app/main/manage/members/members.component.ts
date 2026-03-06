import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectMember, ROLE_LABELS } from '../../../shared/model/ProjectMember';
import { MemberService } from '../../../shared/services/member/member.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { ApiQueryParams } from '../../../shared/constants/api/ApiQueryParams';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { Claims } from '../../../shared/constants/user/Claims';
import { ProjectService } from '../../../shared/services/project/project.service';
import { Project, ProjectVisibility } from '../../../shared/model/Project';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MemberCardComponent } from '../../../common/member-card/member-card.component';

@Component({
    selector: 'app-members',
    imports: [CommonModule, MatButton, MatIcon, MemberCardComponent],
    templateUrl: './members.component.html',
    styleUrl: './members.component.css',
})
export class MembersComponent implements OnInit {
    private readonly memberService = inject(MemberService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly authService = inject(AuthService);
    private readonly projectService = inject(ProjectService);

    projectId = input.required<string>();
    organizationId = input.required<string>();

    members = signal<ProjectMember[]>([]);
    currentUser = signal<Claims | null>(this.authService.currentUserClaims());
    project = signal<Project | null>(null);

    ProjectVisibility = ProjectVisibility;
    roleLabels = ROLE_LABELS;

    ngOnInit(): void {
        this.getProject();
        this.getMembers();
    }

    private getMembers() {
        const params: ApiQueryParams = {
            expand: 'user',
        };

        this.memberService.getMembers(this.projectId(), params).subscribe({
            next: (data) => {
                this.members.set(data.items);
            },
            error: (err) => {
                console.error('Failed to fetch members:', err);
                this.snackbarService.error('Failed to fetch members');
            },
        });
    }

    private getProject() {
        const projectId = this.projectId();
        if (!projectId) {
            console.error('Project ID is required to fetch project details');
            this.snackbarService.open('Project ID is missing', ['snackbar-error']);
            return;
        }

        const organizationId = this.organizationId();
        if (!organizationId) {
            console.error('Organization ID is required to fetch project details');
            this.snackbarService.open('Organization ID is missing', ['snackbar-error']);
            return;
        }

        this.projectService.getProject(organizationId, projectId).subscribe({
            next: (data) => {
                this.project.set(data);
            },
            error: (err) => {
                console.error('Failed to fetch project details:', err);
                this.snackbarService.open('Failed to fetch project details', ['snackbar-error']);
            },
        });
    }

    getRoleBadgeClass(role: number): string {
        const baseClasses = 'shadow-sm';
        switch (role) {
            case 3: // Owner
                return `${baseClasses} bg-light-accent dark:bg-dark-accent text-white`;
            case 2: // Admin
                return `${baseClasses} bg-light-primary dark:bg-dark-primary text-white dark:text-dark-background`;
            case 1: // Member
                return `${baseClasses} bg-light-secondary dark:bg-dark-secondary text-white`;
            default: // Guest
                return `${baseClasses} bg-gray-400 dark:bg-gray-600 text-white`;
        }
    }
}
