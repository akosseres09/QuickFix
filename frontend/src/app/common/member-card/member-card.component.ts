import { Component, input } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { ProjectMember } from '../../shared/model/ProjectMember';
import { Claims } from '../../shared/constants/user/Claims';
import { DatePipe } from '@angular/common';
import { OrganizationMember } from '../../shared/model/OrganizationMember';

@Component({
    selector: 'app-member-card',
    imports: [AvatarComponent, DatePipe],
    templateUrl: './member-card.component.html',
    styleUrl: './member-card.component.css',
})
export class MemberCardComponent {
    member = input.required<ProjectMember | OrganizationMember>();
    currentUser = input.required<Claims | null>();

    RoleLabels = input.required<Record<number, string>>();
    getRoleBadgeClass = input.required<(role: number) => string>();
}
