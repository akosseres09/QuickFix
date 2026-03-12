import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { OrganizationMember } from '../../model/OrganizationMember';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler';

@Injectable({
    providedIn: 'root',
})
export class OrganizationMemberService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    getOrganizationMembers(organizationId: string, params: ApiQueryParams = {}) {
        const qp = ParamsHandler.convertToHttpParams(params);

        return this.http.get<PaginatedResponse<OrganizationMember>>(
            `${this.url}/${organizationId}/member`,
            { params: qp }
        );
    }

    getOrganizationMember(organizationId: number, memberId: number) {
        return this.http.get<OrganizationMember>(
            `${this.url}/${organizationId}/member/${memberId}`
        );
    }
}
