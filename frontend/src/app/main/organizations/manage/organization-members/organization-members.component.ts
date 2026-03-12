import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { OrganizationMemberService } from '../../../../shared/services/organization-member/organization-member.service';
import {
    OrganizationMember,
    ORGANIZATION_MEMBER_ROLE_MAP,
    OrganizationMemberRole,
} from '../../../../shared/model/OrganizationMember';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';
import { MemberCardComponent } from '../../../../common/member-card/member-card.component';
import { AuthService } from '../../../../shared/services/auth/auth.service';

@Component({
    selector: 'app-organization-members',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        MatProgressSpinner,
        MemberCardComponent,
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
    isLoading = signal<boolean>(false);
    currentUser = this.authService.currentUserClaims;

    readonly RoleMap = ORGANIZATION_MEMBER_ROLE_MAP;
    readonly OrganizationMemberRole = OrganizationMemberRole;

    ngOnInit(): void {
        this.getMembers();
    }

    getMembers(): void {
        this.isLoading.set(true);

        this.orgMemberService
            .getOrganizationMembers(this.organizationId(), { expand: 'user' })
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.members.set(response.items);
                },
                error: (err) => {
                    console.error('Failed to fetch members:', err);
                    this.snackbarService.error('Failed to fetch members');
                },
            });
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
}
