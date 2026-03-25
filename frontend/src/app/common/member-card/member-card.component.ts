import { Component, input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { ProjectMember, ProjectMemberRoles } from '../../shared/model/ProjectMember';
import { Claims } from '../../shared/constants/user/Claims';
import { DatePipe } from '@angular/common';
import { OrganizationMember } from '../../shared/model/OrganizationMember';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

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
    ProjectMemberRoles = ProjectMemberRoles;

    RoleLabels = input.required<Record<string, string>>();
    getRoleBadgeClass = input.required<(role: string) => string>();

    canManage = input<boolean>(false);
    availableRoles = input<string[]>([]);

    roleChanged = output<{ memberId: string; role: string }>();
    memberRemoved = output<string>();
}
