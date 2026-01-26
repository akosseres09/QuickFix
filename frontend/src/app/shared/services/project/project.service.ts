import { inject, Injectable } from '@angular/core';
import { Project } from '../../model/Project';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';

export interface ProjectFilters {
    name?: string | null;
    expand?: string | null;
}

@Injectable({
    providedIn: 'root',
})
export class ProjectService {
    private readonly http = inject(HttpClient);
    private readonly url = environment.apiUrl;

    getProjects(filters: Partial<ProjectFilters> = {}) {
        let params = new HttpParams();

        Object.keys(filters).forEach((key) => {
            const value = filters[key as keyof ProjectFilters];

            if (value != null) {
                params = params.set(key, value.toString());
            }
        });

        return this.http.get<Project[]>(`${this.url}/project`, {
            params: params,
        });
    }
}
