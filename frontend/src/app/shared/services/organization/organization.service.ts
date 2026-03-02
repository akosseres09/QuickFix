import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { Organization } from '../../model/Organization';

@Injectable({
    providedIn: 'root',
})
export class OrganizationService {
    private readonly url = environment.apiUrl;
    private readonly http = inject(HttpClient);

    getOrganizations(params: ApiQueryParams = {}) {
        const qp = ParamsHandler.convertToHttpParams(params);
        return this.http.get<PaginatedResponse<Organization>>(`${this.url}/organization`, {
            params: qp,
        });
    }

    delete(orgId: string) {
        return this.http.delete(`${this.url}/organization/${orgId}`);
    }
}
