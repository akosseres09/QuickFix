import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableComponent } from '../../common/table/table.component';
import { Project } from '../../shared/model/Project';
import { DisplayedColumn } from '../../shared/constants/DisplayedColumn';
import { ProjectService } from '../../shared/services/project/project.service';

@Component({
    selector: 'app-projects',
    imports: [MatTableModule, MatPaginatorModule, CommonModule, TableComponent],
    templateUrl: './projects.component.html',
    styleUrl: './projects.component.css',
})
export class ProjectsComponent {
    private projectService = inject(ProjectService);
    projects = signal<Project[]>(this.projectService.getProjects());
    shownProjects = computed(() => new MatTableDataSource<Project>(this.projects()));
    displayedColumns: Array<DisplayedColumn> = [
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
    ];
}
