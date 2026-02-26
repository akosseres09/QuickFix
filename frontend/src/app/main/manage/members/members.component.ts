import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectMember } from '../../../shared/model/ProjectMember';
import { MemberService } from '../../../shared/services/member/member.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { ApiQueryParams } from '../../../shared/constants/api/ApiQueryParams';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { Claims } from '../../../shared/constants/user/Claims';
import { ProjectService } from '../../../shared/services/project/project.service';
import { Project, ProjectVisibility } from '../../../shared/model/Project';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { UserComponent } from './user/user.component';

@Component({
    selector: 'app-members',
    imports: [CommonModule, MatButton, MatIcon, UserComponent],
    templateUrl: './members.component.html',
    styleUrl: './members.component.css',
})
export class MembersComponent implements OnInit {
    private readonly memberService = inject(MemberService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly authService = inject(AuthService);
    private readonly projectService = inject(ProjectService);

    projectId = input.required<string>();
    members = signal<ProjectMember[]>([]);
    currentUser = signal<Claims | null>(this.authService.currentUserClaims());
    project = signal<Project | null>(null);

    ProjectVisibility = ProjectVisibility;

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
                this.snackbarService.open('Failed to fetch members', ['snackbar-error']);
            },
        });
    }

    private getProject() {
        this.projectService.getProject(this.projectId()).subscribe({
            next: (data) => {
                this.project.set(data);
            },
            error: (err) => {
                console.error('Failed to fetch project details:', err);
                this.snackbarService.open('Failed to fetch project details', ['snackbar-error']);
            },
        });
    }
}
