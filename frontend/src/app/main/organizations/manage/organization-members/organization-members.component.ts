import { Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { OrganizationMemberService } from '../../../../shared/services/organization-member/organization-member.service';
import {
    OrganizationMember,
    ORGANIZATION_MEMBER_ROLE_MAP,
    OrganizationMemberRole,
} from '../../../../shared/model/OrganizationMember';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';
import { MemberCardComponent } from '../../../../common/member-card/member-card.component';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { OrgInviteDialogComponent } from '../org-invite-dialog/org-invite-dialog.component';

@Component({
    selector: 'app-organization-members',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        MemberCardComponent,
        OrgInviteDialogComponent,
    ],
    templateUrl: './organization-members.component.html',
    styleUrl: './organization-members.component.css',
})
export class OrganizationMembersComponent implements OnInit {
    private readonly orgMemberService = inject(OrganizationMemberService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly authService = inject(AuthService);

    organizationId = input.required<string>();
    members = signal<OrganizationMember[]>([]);
    cursor = signal<string | null>(null);
    hasMore = signal<boolean>(false);
    isLoading = signal<boolean>(false);
    currentUser = this.authService.currentUserClaims;

    readonly RoleMap = ORGANIZATION_MEMBER_ROLE_MAP;
    readonly OrganizationMemberRole = OrganizationMemberRole;

    inviteDialog = viewChild(OrgInviteDialogComponent);

    ngOnInit(): void {
        this.getMembers();
    }

    loadMore(): void {
        const currentCursor = this.cursor();
        if (currentCursor && !this.isLoading()) {
            this.getMembers(currentCursor);
        }
    }

    getRoleBadgeClass(role: string): string {
        switch (role) {
            case OrganizationMemberRole.OWNER:
                return 'bg-light-accent dark:bg-dark-accent text-white';
            case OrganizationMemberRole.ADMIN:
                return 'bg-light-primary dark:bg-dark-primary text-white dark:text-dark-background';
            case OrganizationMemberRole.MEMBER:
                return 'bg-light-secondary dark:bg-dark-secondary text-white';
            default:
                return 'bg-gray-400 dark:bg-gray-600 text-white';
        }
    }

    openDialog(): void {
        const dial = this.inviteDialog();
        if (dial) {
            dial.open();
        }
    }

    private getMembers(cursor?: string): void {
        this.isLoading.set(true);

        this.orgMemberService
            .getOrganizationMembers(this.organizationId(), { expand: 'user', cursor })
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    if (cursor) {
                        this.members.update((current) => [...current, ...response.items]);
                    } else {
                        this.members.set(response.items);
                    }
                    this.cursor.set(response.nextCursor);
                    this.hasMore.set(response.hasMore);
                },
                error: (err) => {
                    console.error('Failed to fetch members:', err);
                    this.snackbarService.error('Failed to fetch members');
                },
            });
    }
}
