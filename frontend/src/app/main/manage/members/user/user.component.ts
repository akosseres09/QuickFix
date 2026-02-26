import { Component, input } from '@angular/core';
import { AvatarComponent } from '../../../../common/avatar/avatar.component';
import { ProjectMember, ROLE_LABELS } from '../../../../shared/model/ProjectMember';
import { Claims } from '../../../../shared/constants/user/Claims';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-user',
    imports: [AvatarComponent, DatePipe],
    templateUrl: './user.component.html',
    styleUrl: './user.component.css',
})
export class UserComponent {
    member = input.required<ProjectMember>();
    currentUser = input.required<Claims | null>();

    RoleLabels = ROLE_LABELS;

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
