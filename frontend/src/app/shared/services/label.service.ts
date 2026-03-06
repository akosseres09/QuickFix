import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Label } from '../model/Label';
import { ApiQueryParams } from '../constants/api/ApiQueryParams';
import { ParamsHandler } from '../utils/paramsHandler';
import { PaginatedResponse } from '../constants/api/PaginatedResponse';

@Injectable({
    providedIn: 'root',
})
export class LabelService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    createLabel(data: { organizationId: string; projectId: string; label: Omit<Label, 'id'> }) {
        return this.http.post<Label>(
            `${this.url}/${data.organizationId}/${data.projectId}/label`,
            data.label
        );
    }

    getLabelsToProject(data: {
        organizationId: string;
        projectId: string;
        queryParams?: ApiQueryParams;
    }) {
        const params = data.queryParams ? ParamsHandler.convertToHttpParams(data.queryParams) : {};

        return this.http.get<PaginatedResponse<Label>>(
            `${this.url}/${data.organizationId}/${data.projectId}/label`,
            {
                params: params,
            }
        );
    }
}
