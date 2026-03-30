import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { OrganizationMemberService } from './organization-member.service';
import { OrganizationMember } from '../../model/OrganizationMember';
import { MemberRole } from '../../constants/Role';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

const ORG = 'org-1';
const MEMBER_ID = 'member-1';

function fakeMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
    return {
        id: MEMBER_ID,
        organizationId: ORG,
        userId: 'user-1',
        role: MemberRole.MEMBER,
        createdAt: 1700000000,
        createdBy: 'user-owner',
        updatedAt: null,
        updatedBy: null,
        ...overrides,
    };
}

describe('OrganizationMemberService', () => {
    let service: OrganizationMemberService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(OrganizationMemberService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== getOrganizationMembers ====================

    describe('getOrganizationMembers', () => {
        const url = `/${ORG}/member`;

        it('should GET members and map response with cursor headers', () => {
            service.getOrganizationMembers(ORG).subscribe((result) => {
                expect(result.items.length).toBe(1);
                expect(result.nextCursor).toBe('cursor-abc');
                expect(result.hasMore).toBeTrue();
            });

            const req = httpTesting.expectOne((r) => r.url === url);
            expect(req.request.method).toBe('GET');

            req.flush(
                {
                    items: [fakeMember()],
                    _meta: { totalCount: 1, pageCount: 1, currentPage: 1, perPage: 20 },
                    _links: { self: { href: url } },
                } as PaginatedResponse<OrganizationMember>,
                {
                    headers: {
                        'X-Cursor': 'cursor-abc',
                        'X-Has-More': 'true',
                    },
                }
            );
        });

        it('should return empty items when no members', () => {
            service.getOrganizationMembers(ORG).subscribe((result) => {
                expect(result.items).toEqual([]);
                expect(result.hasMore).toBeFalse();
            });

            httpTesting
                .expectOne((r) => r.url === url)
                .flush(
                    {
                        items: [],
                        _meta: { totalCount: 0, pageCount: 0, currentPage: 1, perPage: 20 },
                        _links: { self: { href: url } },
                    },
                    { headers: { 'X-Has-More': 'false' } }
                );
        });

        it('should pass query params', () => {
            service.getOrganizationMembers(ORG, { expand: 'user' }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === url);
            expect(req.request.params.get('expand')).toBe('user');

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

    // ==================== getOrganizationMember ====================

    describe('getOrganizationMember', () => {
        it('should GET a single member', () => {
            const expected = fakeMember();

            service.getOrganizationMember(ORG, MEMBER_ID).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/${ORG}/member/${MEMBER_ID}`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });

        it('should pass query params', () => {
            service.getOrganizationMember(ORG, MEMBER_ID, { expand: 'user' }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === `/${ORG}/member/${MEMBER_ID}`);
            expect(req.request.params.get('expand')).toBe('user');
            req.flush(fakeMember());
        });
    });

    // ==================== updateOrganizationMember ====================

    describe('updateOrganizationMember', () => {
        it('should PUT the role update', () => {
            const data = { role: MemberRole.ADMIN };

            service.updateOrganizationMember(ORG, MEMBER_ID, data).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/member/${MEMBER_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(data);
            req.flush(fakeMember({ role: MemberRole.ADMIN }));
        });
    });

    // ==================== deleteOrganizationMember ====================

    describe('deleteOrganizationMember', () => {
        it('should DELETE at the correct URL', () => {
            service.deleteOrganizationMember(ORG, MEMBER_ID).subscribe();

            const req = httpTesting.expectOne(`/${ORG}/member/${MEMBER_ID}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors', () => {
            service.getOrganizationMember(ORG, 'nonexistent').subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(404),
            });

            httpTesting
                .expectOne(`/${ORG}/member/nonexistent`)
                .flush('Not found', { status: 404, statusText: 'Not Found' });
        });
    });
});
