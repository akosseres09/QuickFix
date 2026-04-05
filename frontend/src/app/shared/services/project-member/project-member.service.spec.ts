import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProjectMemberService } from './project-member.service';
import { ProjectMember } from '../../model/ProjectMember';
import { MemberRole } from '../../constants/Role';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

const ORG = 'org-1';
const PROJECT = 'proj-1';
const MEMBER_ID = 'pm-1';

function fakeMember(overrides: Partial<ProjectMember> = {}): ProjectMember {
    return {
        id: MEMBER_ID,
        projectId: PROJECT,
        userId: 'user-1',
        role: MemberRole.MEMBER,
        createdAt: 1700000000,
        ...overrides,
    };
}

describe('ProjectMemberService', () => {
    let service: ProjectMemberService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(ProjectMemberService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== getProjectMembers ====================

    describe('getProjectMembers', () => {
        const url = `/${ORG}/${PROJECT}/member`;

        it('should GET members and map response with cursor headers', () => {
            service
                .getProjectMembers({ organizationId: ORG, projectId: PROJECT })
                .subscribe((result) => {
                    expect(result.items.length).toBe(1);
                    expect(result.nextCursor).toBe('cursor-abc');
                    expect(result.hasMore).toBeTrue();
                });

            const req = httpTesting.expectOne((r) => r.url === url);
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('expand')).toBe('user');

            req.flush(
                {
                    items: [fakeMember()],
                    _meta: { totalCount: 1, pageCount: 1, currentPage: 1, perPage: 20 },
                    _links: { self: { href: url } },
                } as PaginatedResponse<ProjectMember>,
                {
                    headers: {
                        'X-Next-Cursor': 'cursor-abc',
                        'X-Has-More': 'true',
                    },
                }
            );
        });

        it('should use custom queryParams when provided', () => {
            service
                .getProjectMembers(
                    { organizationId: ORG, projectId: PROJECT },
                    { expand: 'user,project' }
                )
                .subscribe();

            const req = httpTesting.expectOne((r) => r.url === url);
            expect(req.request.params.get('expand')).toBe('user,project');

            req.flush(
                {
                    items: [],
                    _meta: { totalCount: 0, pageCount: 0, currentPage: 1, perPage: 20 },
                    _links: { self: { href: url } },
                },
                { headers: { 'X-Has-More': 'false' } }
            );
        });
    });

    // ==================== addProjectMember ====================

    describe('addProjectMember', () => {
        it('should POST member data', () => {
            const payload = { user_id: 'user-2', role: MemberRole.MEMBER };
            const expected = fakeMember({ userId: 'user-2' });

            service.addProjectMember(ORG, PROJECT, payload).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/member`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(payload);
            req.flush(expected);
        });
    });

    // ==================== updateProjectMember ====================

    describe('updateProjectMember', () => {
        it('should PUT the role update', () => {
            const payload = { role: MemberRole.ADMIN };

            service.updateProjectMember(ORG, PROJECT, MEMBER_ID, payload).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/member/${MEMBER_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(payload);
            req.flush(fakeMember({ role: MemberRole.ADMIN }));
        });
    });

    // ==================== deleteProjectMember ====================

    describe('deleteProjectMember', () => {
        it('should DELETE at the correct URL', () => {
            service.deleteProjectMember(ORG, PROJECT, MEMBER_ID).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/${PROJECT}/member/${MEMBER_ID}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors', () => {
            service.addProjectMember(ORG, PROJECT, { user_id: 'x', role: 'member' }).subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(422),
            });

            httpTesting
                .expectOne(`/${ORG}/${PROJECT}/member`)
                .flush('Validation error', { status: 422, statusText: 'Unprocessable Entity' });
        });
    });
});
