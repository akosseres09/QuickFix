import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ProjectMember,
    ProjectMemberRoles,
    ROLE_LABELS,
    ROLES,
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
import { ApiQueryParams } from '../../../shared/constants/api/ApiQueryParams';
import { ProjectPermissions } from '../../../shared/constants/user/Permissions';
import { ProjectInviteDialogComponent } from './project-invite-dialog/project-invite-dialog.component';

@Component({
    selector: 'app-members',
    imports: [CommonModule, MatButton, MatIcon, MemberCardComponent, ProjectInviteDialogComponent],
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
    cursor = signal<string | null>(null);
    hasMore = signal<boolean>(false);
    isLoading = signal<boolean>(false);
    currentUser = signal<Claims | null>(this.authService.currentUserClaims());
    project = signal<Project | null>(null);

    ProjectVisibility = ProjectVisibility;
    roleLabels = ROLE_LABELS;
    availableRoles = ROLES.filter((r) => r !== ProjectMemberRoles.OWNER);

    canManage = computed(() => {
        const user = this.authService.currentClaimsWithPermissions();
        if (!user) return false;
        return user.canDo(ProjectPermissions.MEMBERS_MANAGE, {
            projectId: this.projectId(),
            orgId: this.organizationId(),
        });
    });

    canInvite = computed(() => {
        const user = this.authService.currentClaimsWithPermissions();
        const project = this.project();
        if (!user || !project || project.visibility !== ProjectVisibility.TEAM) return false;
        return user.canDo(ProjectPermissions.MEMBER_INVITE, {
            projectId: this.projectId(),
            orgId: this.organizationId(),
        });
    });

    ngOnInit(): void {
        this.getProject();
        this.getMembers();
    }

    loadMore() {
        const currentCursor = this.cursor();
        if (currentCursor && !this.isLoading()) {
            this.getMembers(currentCursor);
        }
    }

    onMemberAdded(): void {
        this.members.set([]);
        this.cursor.set(null);
        this.hasMore.set(false);
        this.getMembers();
    }

    onRoleChanged(event: { memberId: string; role: string }): void {
        this.memberService
            .updateProjectMember(this.organizationId(), this.projectId(), event.memberId, {
                role: event.role,
            })
            .subscribe({
                next: (updated) => {
                    this.members.update((members) =>
                        members.map((m) =>
                            m.id === event.memberId ? { ...m, role: updated.role } : m
                        )
                    );
                    this.snackbarService.success('Role updated successfully');
                },
                error: () => {
                    this.snackbarService.error('Failed to update role');
                },
            });
    }

    onMemberRemoved(memberId: string): void {
        this.memberService
            .deleteProjectMember(this.organizationId(), this.projectId(), memberId)
            .subscribe({
                next: () => {
                    this.members.update((members) => members.filter((m) => m.id !== memberId));
                    this.snackbarService.success('Member removed successfully');
                },
                error: () => {
                    this.snackbarService.error('Failed to remove member');
                },
            });
    }

    private getMembers(cursor?: string) {
        const params: ApiQueryParams = { expand: 'user', cursor: cursor ?? undefined };

        this.memberService
            .getProjectMembers(
                {
                    organizationId: this.organizationId(),
                    projectId: this.projectId(),
                },
                params
            )
            .subscribe({
                next: (data) => {
                    if (cursor) {
                        this.members.update((members) => [...members, ...data.items]);
                    } else {
                        this.members.set(data.items);
                    }
                    this.cursor.set(data.nextCursor);
                    this.hasMore.set(data.hasMore);
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
