import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { OrganizationMember } from '../../model/OrganizationMember';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler';
import { map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class OrganizationMemberService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    getOrganizationMembers(organizationId: string, params: ApiQueryParams = {}) {
        const qp = ParamsHandler.convertToHttpParams(params);

        return this.http
            .get<
                PaginatedResponse<OrganizationMember>
            >(`${this.url}/${organizationId}/member`, { params: qp, observe: 'response' })
            .pipe(
                map((response) => ({
                    items: response.body?.items ?? [],
                    nextCursor: response.headers.get('X-Cursor'),
                    hasMore: response.headers.get('X-Has-More') === 'true',
                }))
            );
    }

    getOrganizationMember(organizationId: string, memberId: string, params: ApiQueryParams = {}) {
        const qp = ParamsHandler.convertToHttpParams(params);

        return this.http.get<OrganizationMember>(
            `${this.url}/${organizationId}/member/${memberId}`,
            { params: qp }
        );
    }

    updateOrganizationMember(organizationId: string, memberId: string, data: { role: string }) {
        return this.http.put<OrganizationMember>(
            `${this.url}/${organizationId}/member/${memberId}`,
            data
        );
    }

    deleteOrganizationMember(organizationId: string, memberId: string) {
        return this.http.delete<void>(`${this.url}/${organizationId}/member/${memberId}`);
    }
}
