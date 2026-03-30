import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { OrganizationService } from './organization.service';
import { Organization } from '../../model/Organization';
import { PaginatedResponse } from '../../constants/api/PaginatedResponse';

const ORG_ID = 'org-1';

function fakeOrg(overrides: Partial<Organization> = {}): Organization {
    return {
        id: ORG_ID,
        name: 'Acme Corp',
        slug: 'acme-corp',
        description: 'Test org',
        logoUrl: null,
        ownerId: 'user-1',
        createdAt: 1700000000,
        updatedAt: 1700000000,
        updatedBy: null,
        deletedAt: null,
        ...overrides,
    };
}

function fakePaginated<T>(items: T[]): PaginatedResponse<T> {
    return {
        items,
        _meta: { totalCount: items.length, pageCount: 1, currentPage: 1, perPage: 20 },
        _links: { self: { href: '/organization' } },
    };
}

describe('OrganizationService', () => {
    let service: OrganizationService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(OrganizationService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== getOrganizations ====================

    describe('getOrganizations', () => {
        it('should GET organizations with no params by default', () => {
            const expected = fakePaginated([fakeOrg()]);

            service.getOrganizations().subscribe((result) => {
                expect(result).toEqual(expected);
                expect(result.items.length).toBe(1);
            });

            const req = httpTesting.expectOne('/organization');
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });

        it('should pass query params', () => {
            service.getOrganizations({ page: 2, pageSize: 5 }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === '/organization');
            expect(req.request.params.get('page')).toBe('2');
            expect(req.request.params.get('pageSize')).toBe('5');
            req.flush(fakePaginated([]));
        });

        it('should filter out null params', () => {
            service.getOrganizations({ page: null, sort: '-name' }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === '/organization');
            expect(req.request.params.has('page')).toBeFalse();
            expect(req.request.params.get('sort')).toBe('-name');
            req.flush(fakePaginated([]));
        });
    });

    // ==================== getOrganization ====================

    describe('getOrganization', () => {
        it('should GET a single organization by ID', () => {
            const expected = fakeOrg();

            service.getOrganization(ORG_ID).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/organization/${ORG_ID}`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });
    });

    // ==================== createOrganization ====================

    describe('createOrganization', () => {
        it('should POST the organization data', () => {
            const data: Partial<Organization> = { name: 'New Org', slug: 'new-org' };
            const expected = fakeOrg({ name: 'New Org', slug: 'new-org' });

            service.createOrganization(data).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne('/organization');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(data);
            req.flush(expected);
        });
    });

    // ==================== updateOrganization ====================

    describe('updateOrganization', () => {
        it('should PUT the organization data to the correct URL', () => {
            const data: Partial<Organization> = { id: ORG_ID, name: 'Updated' };
            const expected = fakeOrg({ name: 'Updated' });

            service.updateOrganization(data).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/organization/${ORG_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(data);
            req.flush(expected);
        });

        it('should throw when id is missing', () => {
            expect(() => service.updateOrganization({ name: 'No ID' })).toThrowError(
                'Organization ID is required for update'
            );
        });
    });

    // ==================== delete ====================

    describe('delete', () => {
        it('should DELETE the organization at the correct URL', () => {
            service.delete(ORG_ID).subscribe();

            const req = httpTesting.expectOne(`/organization/${ORG_ID}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors', () => {
            service.getOrganizations().subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(500),
            });

            httpTesting
                .expectOne('/organization')
                .flush('Server error', { status: 500, statusText: 'Internal Server Error' });
        });
    });
});
