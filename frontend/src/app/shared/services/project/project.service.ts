import { inject, Injectable } from '@angular/core';
import { Project } from '../../model/Project';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { ParamsHandler } from '../../utils/paramsHandler';

@Injectable({
    providedIn: 'root',
})
export class ProjectService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    /**
     * Fetches projects with optional query parameters
     * Automatically filters out null/undefined/empty values
     * Returns paginated response with metadata
     */
    getProjects(
        organizationId: string,
        queryParams: ApiQueryParams = {}
    ): Observable<PaginatedResponse<Project>> {
        const params = ParamsHandler.convertToHttpParams(queryParams);

        return this.http.get<PaginatedResponse<Project>>(`${this.url}/${organizationId}/project`, {
            params: params,
        });
    }

    /**
     * Fetches projects and returns only the items array (legacy support)
     * Use this if you don't need pagination metadata
     */
    getProjectsSimple(
        organizationId: string,
        queryParams: ApiQueryParams = {}
    ): Observable<Project[]> {
        return this.getProjects(organizationId, queryParams).pipe(
            map((response) => response.items)
        );
    }

    getProject(identifier: string): Observable<Project> {
        return this.http.get<Project>(`${this.url}/project/${identifier}`);
    }

    /**
     * Creates a new project
     */
    createProject(project: Partial<Project>): Observable<Project> {
        return this.http.post<Project>(`${this.url}/project`, project);
    }

    /**
     * Updates an existing project
     */
    updateProject(id: string, project: Partial<Project>): Observable<Project> {
        return this.http.put<Project>(`${this.url}/project/${id}`, project);
    }

    /**
     * Deletes a project
     */
    deleteProject(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/project/${id}`);
    }
}
