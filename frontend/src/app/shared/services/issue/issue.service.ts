import { inject, Injectable, signal } from '@angular/core';
import { Issue } from '../../model/Issue';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { ApiQueryParams } from '../../constants/api/ApiQueryParams';
import { map, Observable } from 'rxjs';
import { ParamsHandler } from '../../utils/paramsHandler';

@Injectable({
    providedIn: 'root',
})
export class IssueService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;
    private projectId = signal<string>('');

    /**
     * Creates a new issue
     * @param issue Partial issue object containing required fields (e.g., title, projectId)
     * @returns Observable of the created Issue
     */
    createIssue(issue: Partial<Issue>): Observable<Issue> {
        this.checkIfProjectIdSet();

        return this.http.post<Issue>(`${this.url}/${this.projectId()}/issue`, issue);
    }

    /**
     * Fetches issues with optional query parameters
     * Automatically filters out null/undefined/empty values
     * Returns paginated response with metadata
     */
    getIssues(queryParams: ApiQueryParams = {}): Observable<PaginatedResponse<Issue>> {
        this.checkIfProjectIdSet();

        const params = ParamsHandler.convertToHttpParams(queryParams);

        return this.http.get<PaginatedResponse<Issue>>(`${this.url}/${this.projectId()}/issue`, {
            params: params,
        });
    }

    getIssueById(id: string, expand: string = 'creator,assignee,updator'): Observable<Issue> {
        this.checkIfProjectIdSet();

        return this.http.get<Issue>(`${this.url}/${this.projectId()}/issue/${id}`, {
            params: {
                expand: expand,
            },
        });
    }

    /**
     * Fetches issues and returns only the items array (legacy support)
     * Use this if you don't need pagination metadata
     * @param queryParams Optional query parameters for filtering/sorting/pagination
     * @returns Observable of an array of Issues
     */
    getIssuesSimple(queryParams: ApiQueryParams = {}): Observable<Issue[]> {
        this.checkIfProjectIdSet();

        return this.getIssues(queryParams).pipe(map((response) => response.items));
    }

    /**
     * Updates an existing issue
     * @param id ID of the issue to update
     * @param issue Partial issue object containing fields to update (e.g., title, status)
     * @returns Observable of the updated Issue
     */
    updateIssue(id: string, issue: Partial<Issue>): Observable<Issue> {
        this.checkIfProjectIdSet();

        return this.http.put<Issue>(`${this.url}/${this.projectId()}/issue/${id}`, issue);
    }

    /**
     * Deletes an issue by ID
     * @param id ID of the issue to delete
     * @returns Observable of void
     */
    deleteIssue(id: string): Observable<void> {
        this.checkIfProjectIdSet();

        return this.http.delete<void>(`${this.url}/${this.projectId()}/issue/${id}`);
    }

    /**
     * Should be called before using any of the service methods to set the current project context
     * @param projectId the id of the project to set for this service instance (e.g., 'QF_IT')
     */
    setProjectId(projectId: string) {
        this.projectId.set(projectId);
    }

    /**
     * Internal method to check if projectId is set before making API calls
     * @throws Error if projectId is not set
     */
    private checkIfProjectIdSet(): void {
        const projectId = this.projectId();

        if (!projectId || projectId.trim() === '') {
            throw new Error(
                'Project ID is not set. Please call setProjectId(projectId) before using the service methods.'
            );
        }
    }
}
