import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableComponent } from '../../common/table/table.component';
import { Project } from '../../shared/model/Project';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { ProjectFilters, ProjectService } from '../../shared/services/project/project.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
    MAT_FORM_FIELD_DEFAULT_OPTIONS,
    MatFormField,
    MatLabel,
} from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { debounce } from 'rxjs';
import { UrlService } from '../../shared/services/url/url.service';
import { ActivatedRoute } from '@angular/router';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-projects',
    imports: [
        MatTableModule,
        MatPaginatorModule,
        CommonModule,
        TableComponent,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatOptionModule,
        MatFormField,
        MatInput,
        MatLabel,
        MatButton,
    ],
    providers: [
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    ],
    templateUrl: './projects.component.html',
    styleUrl: './projects.component.css',
})
export class ProjectsComponent {
    private readonly urlService = inject(UrlService);
    private readonly fb = inject(FormBuilder);
    private readonly projectService = inject(ProjectService);
    private readonly activeRoute = inject(ActivatedRoute);
    projects = signal<Project[]>(this.projectService.getProjects());

    filterForm = this.fb.group({
        projectName: [this.activeRoute.snapshot.queryParamMap.get('projectName') || ''],
    });
    showFilterReset = signal<boolean>(this.activeRoute.snapshot.queryParamMap.has('projectName'));
    filteredProjects = signal<Project[]>(this.projectService.getProjects(this.filterForm.value));
    shownProjects = computed(() => new MatTableDataSource<Project>(this.filteredProjects()));
    displayedColumns = signal<DisplayedColumn[]>([
        {
            id: 'name',
            label: 'Name',
            sortable: true,
            value: (e: Project) => e.name,
            link: true,
        },
        {
            id: 'admin',
            label: 'Admin',
            sortable: false,
            value: (e: Project) => e.admin.username,
        },
        {
            id: 'users',
            label: '# of users',
            sortable: true,
            value: (e: Project) => e.users.length,
        },
        {
            id: 'createdAt',
            label: 'Created At',
            sortable: true,
            value: (e: Project) => e.createdAt,
        },
    ]);

    constructor() {
        this.filterForm.valueChanges
            .pipe(debounce(() => new Promise((resolve) => setTimeout(resolve, 300))))
            .subscribe((filters) => {
                const filterArray = Object.entries(filters);
                filterArray.forEach(([key, value]) => {
                    if (!value) {
                        filters[key as keyof ProjectFilters] = null;
                    }
                });

                if (filterArray.some(([_, value]) => value)) {
                    this.showFilterReset.set(true);
                }
                this.urlService.addQueryParams(filters);
                this.filteredProjects.set(this.projectService.getProjects(filters));
            });
    }

    resetFilters() {
        this.filterForm.reset();
        this.showFilterReset.set(false);
    }
}
