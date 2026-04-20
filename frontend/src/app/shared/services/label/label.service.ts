import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Label } from '../../model/Label';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { ParamsHandler } from '../../utils/paramsHandler/paramsHandler';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LabelService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    /**
     * Creates a new label in the specified project and organization.
     * @param data An object containing the organization ID, project ID, and label details (excluding ID and projectId).
     * @returns An Observable that emits the created Label object upon successful creation.
     */
    createLabel(data: {
        organizationId: string;
        projectId: string;
        label: Omit<Label, 'id' | 'projectId'>;
    }): Observable<Label> {
        return this.http.post<Label>(
            `${this.url}/${data.organizationId}/${data.projectId}/label`,
            data.label
        );
    }

    /**
     * Retrieves a list of labels for a specific project and organization.
     * @param data An object containing the organization ID, project ID, and optional query parameters.
     * @returns An Observable that emits the paginated list of Label objects upon successful retrieval.
     */
    getLabelsToProject(data: {
        organizationId: string;
        projectId: string;
        queryParams?: ApiQueryParams;
    }): Observable<PaginatedResponse<Label>> {
        const params = data.queryParams ? ParamsHandler.convertToHttpParams(data.queryParams) : {};

        return this.http.get<PaginatedResponse<Label>>(
            `${this.url}/${data.organizationId}/${data.projectId}/label`,
            {
                params: params,
            }
        );
    }

    /**
     * Updates an existing label in the specified project and organization.
     * @param data An object containing the organization ID, project ID, label ID, and updated label details.
     * @returns An Observable that emits the updated Label object upon successful update.
     */
    updateLabel(data: {
        organizationId: string;
        projectId: string;
        labelId: string;
        label: Omit<Label, 'id'>;
    }): Observable<Label> {
        return this.http.put<Label>(
            `${this.url}/${data.organizationId}/${data.projectId}/label/${data.labelId}`,
            data.label
        );
    }

    /**
     * Reorders a label within the specified project and organization by sending a POST request with the new index.
     * @param data An object containing the organization ID, project ID, label ID, and the new index for the label.
     * @returns An Observable that emits the updated Label object upon successful reordering.
     */
    reorderLabel(data: {
        organizationId: string;
        projectId: string;
        labelId: string;
        newIndex: number;
    }): Observable<Label> {
        return this.http.post<Label>(
            `${this.url}/${data.organizationId}/${data.projectId}/label/${data.labelId}/reorder`,
            { new_index: data.newIndex }
        );
    }

    /**
     * Deletes a label from the specified project and organization by sending a DELETE request with the label ID.
     * If the label is used by any issues, the server will return an error response, and the label will not be deleted.
     * @param data An object containing the organization ID, project ID, and label ID.
     * @returns An Observable that emits an unknown value upon successful deletion.
     */
    deleteLabel(data: {
        organizationId: string;
        projectId: string;
        labelId: string;
    }): Observable<unknown> {
        return this.http.delete(
            `${this.url}/${data.organizationId}/${data.projectId}/label/${data.labelId}`
        );
    }
}
