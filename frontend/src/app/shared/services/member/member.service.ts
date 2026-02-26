import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { ProjectMember } from '../../model/ProjectMember';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler';

@Injectable({
    providedIn: 'root',
})
export class MemberService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    getMembers(projectId: string, queryParams: ApiQueryParams = {}) {
        let params = ParamsHandler.convertToHttpParams(queryParams);

        return this.http.get<PaginatedResponse<ProjectMember>>(`${this.url}/${projectId}/member`, {
            params: params,
        });
    }
}
