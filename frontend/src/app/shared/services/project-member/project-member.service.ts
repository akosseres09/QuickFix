import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { ProjectMember } from '../../model/ProjectMember';
import { environment } from '../../../../environments/environment.development';

@Injectable({
    providedIn: 'root',
})
export class ProjectMemberService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    getProjectMembers(projectId: string) {
        return this.http.get<PaginatedResponse<ProjectMember>>(
            `${this.apiUrl}/${projectId}/member`,
            {
                params: {
                    expand: 'user',
                },
            }
        );
    }
}
