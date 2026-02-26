import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ProjectMember } from '../../../shared/model/ProjectMember';
import { MemberService } from '../../../shared/services/member/member.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { ApiQueryParams } from '../../../shared/constants/api/ApiQueryParams';
import { ParamsHandler } from '../../../shared/utils/paramsHandler';

@Component({
    selector: 'app-members',
    imports: [],
    templateUrl: './members.component.html',
    styleUrl: './members.component.css',
})
export class MembersComponent implements OnInit {
    private readonly memberService = inject(MemberService);
    private readonly snackbarService = inject(SnackbarService);

    projectId = input.required<string>();
    members = signal<ProjectMember[]>([]);

    ngOnInit(): void {
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
}
