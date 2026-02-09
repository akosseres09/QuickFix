import { inject, Injectable } from '@angular/core';
import { Project } from '../../model/Project';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { map, Observable } from 'rxjs';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

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
    getProjects(queryParams: ApiQueryParams = {}): Observable<PaginatedResponse<Project>> {
        let params = new HttpParams();

        Object.entries(queryParams).forEach(([key, value]) => {
            // Only add non-null, non-undefined, non-empty values
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value.toString());
            }
        });

        return this.http.get<PaginatedResponse<Project>>(`${this.url}/project`, {
            params: params,
        });
    }

    /**
     * Fetches projects and returns only the items array (legacy support)
     * Use this if you don't need pagination metadata
     */
    getProjectsSimple(queryParams: ApiQueryParams = {}): Observable<Project[]> {
        return this.getProjects(queryParams).pipe(map((response) => response.items));
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
