import { Component, computed, input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { ProjectMember } from '../../shared/model/ProjectMember';
import { Claims } from '../../shared/constants/user/Claims';
import { DatePipe } from '@angular/common';
import { OrganizationMember } from '../../shared/model/OrganizationMember';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MemberRole, ROLE_MAP } from '../../shared/constants/Role';

@Component({
    selector: 'app-member-card',
    imports: [AvatarComponent, DatePipe, MatIconButton, MatIcon, MatMenuModule],
    templateUrl: './member-card.component.html',
    styleUrl: './member-card.component.css',
})
export class MemberCardComponent {
    member = input.required<ProjectMember | OrganizationMember>();
    organizationId = input.required<string>();
    currentUser = input.required<Claims | null>();

    canManage = input<boolean>(false);
    availableRoles = input<string[]>([]);

    roleChanged = output<{ memberId: string; role: string }>();
    memberRemoved = output<string>();

    protected readonly ownerRole = MemberRole.OWNER;

    protected roleBadgeClass = computed(() => {
        return this.getRoleBadgeClass(this.member().role);
    });

    getRoleLabel(role: string): string {
        return ROLE_MAP[role] ?? role;
    }

    getRoleBadgeClass(role: string): string {
        switch (role) {
            case MemberRole.OWNER:
                return 'bg-amber-500 dark:bg-amber-600 text-white shadow-sm';
            case MemberRole.ADMIN:
                return 'bg-violet-500 dark:bg-violet-600 text-white shadow-sm';
            case MemberRole.MEMBER:
                return 'bg-sky-500 dark:bg-sky-600 text-white shadow-sm';
            default:
                return 'bg-gray-400 dark:bg-gray-500 text-white shadow-sm';
        }
    }
}
