import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ProjectMember,
    ProjectMemberRoles,
    ROLE_LABELS,
} from '../../../shared/model/ProjectMember';
import { ProjectMemberService } from '../../../shared/services/project-member/project-member.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
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
    private readonly memberService = inject(ProjectMemberService);
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
        this.memberService
            .getProjectMembers({
                organizationId: this.organizationId(),
                projectId: this.projectId(),
            })
            .subscribe({
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

    getRoleBadgeClass(role: string): string {
        const baseClasses = 'shadow-sm';
        switch (role) {
            case ProjectMemberRoles.OWNER:
                return `${baseClasses} bg-light-accent dark:bg-dark-accent text-white`;
            case ProjectMemberRoles.ADMIN:
                return `${baseClasses} bg-light-primary dark:bg-dark-primary text-white dark:text-dark-background`;
            case ProjectMemberRoles.MEMBER:
                return `${baseClasses} bg-light-secondary dark:bg-dark-secondary text-white`;
            default:
                return `${baseClasses} bg-gray-400 dark:bg-gray-600 text-white`;
        }
    }
}
