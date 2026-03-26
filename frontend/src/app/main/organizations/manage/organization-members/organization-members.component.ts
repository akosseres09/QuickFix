import { Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { OrganizationMemberService } from '../../../../shared/services/organization-member/organization-member.service';
import { OrganizationMember } from '../../../../shared/model/OrganizationMember';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';
import { MemberCardComponent } from '../../../../common/member-card/member-card.component';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { OrgInviteDialogComponent } from '../org-invite-dialog/org-invite-dialog.component';
import { OrganizationPermissions } from '../../../../shared/constants/user/Permissions';
import { MemberRole } from '../../../../shared/constants/Role';

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
    currentUser = this.authService.currentClaimsWithPermissions;

    readonly OrganizationMemberRole = MemberRole;
    availableRoles = [MemberRole.GUEST, MemberRole.MEMBER, MemberRole.ADMIN];

    canManage = computed(() => {
        const user = this.authService.currentClaimsWithPermissions();
        if (!user) return false;
        return user.canDo(OrganizationPermissions.MEMBERS_MANAGE, {
            orgId: this.organizationId(),
        });
    });

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

    onRoleChanged(event: { memberId: string; role: string }): void {
        this.orgMemberService
            .updateOrganizationMember(this.organizationId(), event.memberId, {
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
        this.orgMemberService.deleteOrganizationMember(this.organizationId(), memberId).subscribe({
            next: () => {
                this.members.update((members) => members.filter((m) => m.id !== memberId));
                this.snackbarService.success('Member removed successfully');
            },
            error: () => {
                this.snackbarService.error('Failed to remove member');
            },
        });
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

    protected canUserInvite(): boolean {
        return (
            this.currentUser()?.canDo(OrganizationPermissions.MEMBER_INVITE, {
                orgId: this.organizationId(),
            }) ?? false
        );
    }
}
