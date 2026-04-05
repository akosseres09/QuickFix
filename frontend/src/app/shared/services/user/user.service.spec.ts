import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { User, UserStatus, UserRole } from '../../model/User';

const USER_ID = 'user-42';

function fakeUser(overrides: Partial<User> = {}): User {
    return {
        id: USER_ID,
        username: 'johndoe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        phoneNumber: null,
        dateOfBirth: null,
        profilePictureUrl: 'https://example.com/pic.jpg',
        status: UserStatus.ACTIVE,
        isAdmin: UserRole.USER,
        createdAt: 1700000000,
        updatedAt: null,
        deletedAt: null,
        ...overrides,
    };
}

describe('UserService', () => {
    let service: UserService;
    let httpTesting: HttpTestingController;
    let authServiceSpy: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        const claimsSignal = jasmine.createSpy('currentUserClaims').and.returnValue({
            uid: USER_ID,
            email: 'john@example.com',
            role: { name: 'user', value: 0 },
        });

        authServiceSpy = jasmine.createSpyObj('AuthService', [], {
            currentUserClaims: claimsSignal,
        });

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceSpy },
            ],
        });
        service = TestBed.inject(UserService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ==================== getUser ====================

    describe('getUser', () => {
        it('should GET the current user by ID from auth claims', () => {
            const expected = fakeUser();

            service.getUser().subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/user/${USER_ID}`);
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });
    });

    // ==================== getUserByUsername ====================

    describe('getUserByUsername', () => {
        it('should GET user by username', () => {
            const expected = fakeUser();

            service.getUserByUsername('johndoe').subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne('/user/johndoe');
            expect(req.request.method).toBe('GET');
            req.flush(expected);
        });

        it('should pass query params', () => {
            service.getUserByUsername('johndoe', { expand: 'organizations' }).subscribe();

            const req = httpTesting.expectOne((r) => r.url === '/user/johndoe');
            expect(req.request.params.get('expand')).toBe('organizations');
            req.flush(fakeUser());
        });
    });

    // ==================== getUserByEmail ====================

    describe('getUserByEmail', () => {
        it('should GET user by email', () => {
            service.getUserByEmail('john@example.com').subscribe();

            const req = httpTesting.expectOne('/user/john@example.com');
            expect(req.request.method).toBe('GET');
            req.flush(fakeUser());
        });
    });

    // ==================== updateUser ====================

    describe('updateUser', () => {
        it('should PUT user data with updated_at and mapped fields', () => {
            const userData: Partial<User> = { firstName: 'Jane', phoneNumber: '555-1234' };

            service.updateUser(userData).subscribe();

            const req = httpTesting.expectOne(`/user/${USER_ID}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body.phone_number).toBe('555-1234');
            expect(req.request.body.updated_at).toBeDefined();
            req.flush(fakeUser({ firstName: 'Jane' }));
        });
    });

    // ==================== uploadProfilePicture ====================

    describe('uploadProfilePicture', () => {
        it('should POST FormData with the file', () => {
            const file = new File(['data'], 'avatar.png', { type: 'image/png' });
            const expected = {
                success: true,
                data: { profilePictureUrl: 'https://example.com/new.jpg' },
            };

            service.uploadProfilePicture(file).subscribe((result) => {
                expect(result).toEqual(expected);
            });

            const req = httpTesting.expectOne(`/user/${USER_ID}/upload-profile-picture`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body instanceof FormData).toBeTrue();
            req.flush(expected);
        });
    });

    // ==================== error handling ====================

    describe('error handling', () => {
        it('should propagate HTTP errors', () => {
            service.getUser().subscribe({
                next: () => fail('expected error'),
                error: (err) => expect(err.status).toBe(401),
            });

            httpTesting
                .expectOne(`/user/${USER_ID}`)
                .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
        });
    });
});
