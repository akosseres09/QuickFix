import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { ProjectMember } from '../../model/ProjectMember';
import { environment } from '../../../../environments/environment';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler';
import { map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ProjectMemberService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    getProjectMembers(
        ids: { organizationId: string; projectId: string; cursor?: string },
        queryParams: ApiQueryParams = { expand: 'user' }
    ) {
        const qp = ParamsHandler.convertToHttpParams(queryParams);
        if (ids.cursor) {
            qp.set('cursor', ids.cursor);
        }

        return this.http
            .get<PaginatedResponse<ProjectMember>>(
                `${this.apiUrl}/${ids.organizationId}/${ids.projectId}/member`,
                {
                    params: qp,
                    observe: 'response',
                }
            )
            .pipe(
                map((response) => ({
                    items: response.body?.items ?? [],
                    nextCursor: response.headers.get('X-Cursor'),
                    hasMore: response.headers.get('X-Has-More') === 'true',
                }))
            );
    }

    addProjectMember(
        organizationId: string,
        projectId: string,
        payload: { user_id: string; role: string }
    ) {
        return this.http.post<ProjectMember>(
            `${this.apiUrl}/${organizationId}/${projectId}/member`,
            payload
        );
    }

    updateProjectMember(
        organizationId: string,
        projectId: string,
        memberId: string,
        payload: { role: string }
    ) {
        return this.http.put<ProjectMember>(
            `${this.apiUrl}/${organizationId}/${projectId}/member/${memberId}`,
            payload
        );
    }

    deleteProjectMember(organizationId: string, projectId: string, memberId: string) {
        return this.http.delete(`${this.apiUrl}/${organizationId}/${projectId}/member/${memberId}`);
    }
}
