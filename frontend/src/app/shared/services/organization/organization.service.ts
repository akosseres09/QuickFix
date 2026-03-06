import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
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

    getOrganization(orgId: string) {
        return this.http.get<Organization>(`${this.url}/organization/${orgId}`);
    }

    createOrganization(data: Partial<Organization>) {
        return this.http.post<Organization>(`${this.url}/organization`, data);
    }

    updateOrganization(data: Partial<Organization>) {
        if (!data.id) {
            throw new Error('Organization ID is required for update');
        }

        return this.http.put<Organization>(`${this.url}/organization/${data.id}`, data);
    }

    delete(orgId: string) {
        return this.http.delete(`${this.url}/organization/${orgId}`);
    }
}
