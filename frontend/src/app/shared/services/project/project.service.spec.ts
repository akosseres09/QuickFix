import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProjectService } from './project.service';
import { Project, ProjectStatus, ProjectVisibility, ProjectPriority } from '../../model/Project';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

const ORG = 'org-1';
const PROJECT_ID = 'proj-1';

function fakeProject(overrides: Partial<Project> = {}): Project {
    return {
        id: PROJECT_ID,
        organizationId: ORG,
        name: 'Website',
        key: 'WEB',
        description: 'Main website project',
        status: ProjectStatus.ACTIVE,
        ownerId: 'user-1',
        updatedBy: null,
        visibility: ProjectVisibility.PRIVATE,
        priority: ProjectPriority.MEDIUM,
        createdAt: 1700000000,
        updatedAt: 1700000000,
        archivedAt: 0,
        isArchived: false,
        ...overrides,
    };
}

function fakePaginated<T>(items: T[]): PaginatedResponse<T> {
    return {
        items,
        _meta: { totalCount: items.length, pageCount: 1, currentPage: 1, perPage: 20 },
        _links: { self: { href: '/project' } },
    };
}

describe('ProjectService', () => {
    let service: ProjectService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(ProjectService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== getProjects ====================

    describe('getProjects', () => {
        it('should GET projects with no params by default', () => {
            const expected = fakePaginated([fakeProject()]);

            service.getProjects(ORG).subscribe((result) => {
                expect(result.items.length).toBe(1);
            });

            const req = httpTesting.expectOne(`/${ORG}/project`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });

        it('should pass query params', () => {
            service.getProjects(ORG, { page: 2, sort: 'name' }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === `/${ORG}/project`);
            expect(req.request.params.get('page')).toBe('2');
            expect(req.request.params.get('sort')).toBe('name');
            req.flush(fakePaginated([]));
        });
    });

    // ==================== getProjectsSimple ====================

    describe('getProjectsSimple', () => {
        it('should return only the items array', () => {
            const projects = [fakeProject(), fakeProject({ id: 'proj-2', name: 'API' })];

            service.getProjectsSimple(ORG).subscribe((result) => {
                expect(result).toEqual(projects);
                expect(result.length).toBe(2);
            });

            httpTesting.expectOne(`/${ORG}/project`).flush(fakePaginated(projects));
        });

        it('should return empty array when no projects', () => {
            service.getProjectsSimple(ORG).subscribe((result) => {
                expect(result).toEqual([]);
            });

            httpTesting.expectOne(`/${ORG}/project`).flush(fakePaginated([]));
        });
    });

    // ==================== getProject ====================

    describe('getProject', () => {
        it('should GET a single project by identifier', () => {
            const expected = fakeProject();

            service.getProject(ORG, 'WEB').subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/${ORG}/project/WEB`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });
    });

    // ==================== createProject ====================

    describe('createProject', () => {
        it('should POST project data', () => {
            const data: Partial<Project> = { name: 'New Project', key: 'NP' };
            const expected = fakeProject({ name: 'New Project', key: 'NP' });

            service.createProject(ORG, data).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/${ORG}/project`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(data);
            req.flush(expected);
        });
    });

    // ==================== updateProject ====================

    describe('updateProject', () => {
        it('should PUT partial project data', () => {
            const data: Partial<Project> = { name: 'Updated' };
            const expected = fakeProject({ name: 'Updated' });

            service.updateProject(ORG, PROJECT_ID, data).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/${ORG}/project/${PROJECT_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(data);
            req.flush(expected);
        });
    });

    // ==================== deleteProject ====================

    describe('deleteProject', () => {
        it('should DELETE at the correct URL', () => {
            service.deleteProject(ORG, PROJECT_ID).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/project/${PROJECT_ID}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors', () => {
            service.getProject(ORG, 'nonexistent').subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(404),
            });

            httpTesting
                .expectOne(`/${ORG}/project/nonexistent`)
                .flush('Not found', { status: 404, statusText: 'Not Found' });
        });
    });
});
