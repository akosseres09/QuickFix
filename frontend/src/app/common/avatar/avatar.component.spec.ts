import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AvatarComponent } from './avatar.component';
import { User, UserStatus, UserRole } from '../../shared/model/User';

describe('AvatarComponent', () => {
    let component: AvatarComponent;
    let fixture: ComponentFixture<AvatarComponent>;

    const mockUser: User = {
        id: 'u-1',
        username: 'jdoe',
        email: 'jdoe@test.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        phoneNumber: null,
        dateOfBirth: null,
        profilePictureUrl: '',
        status: UserStatus.ACTIVE,
        isAdmin: UserRole.USER,
        createdAt: 1000,
        updatedAt: 2000,
        deletedAt: null,
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AvatarComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(AvatarComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('user', mockUser);
        fixture.componentRef.setInput('organizationId', 'org-1');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('when user has no profile picture', () => {
        it('should show fallback icon', () => {
            const icon = fixture.nativeElement.querySelector('mat-icon');
            expect(icon).toBeTruthy();
            expect(icon.textContent.trim()).toBe('person');
        });

        it('should not render an img element', () => {
            expect(fixture.nativeElement.querySelector('img')).toBeNull();
        });
    });

    describe('when user has a profile picture', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('user', {
                ...mockUser,
                profilePictureUrl: 'https://example.com/photo.jpg',
            });
            fixture.detectChanges();
        });

        it('should render an img element', () => {
            const img = fixture.nativeElement.querySelector('img');
            expect(img).toBeTruthy();
            expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
        });

        it('should link to the member page', () => {
            const link = fixture.nativeElement.querySelector('a');
            expect(link.getAttribute('href')).toBe('/org/org-1/member/jdoe');
        });

        it('should set alt attribute to username', () => {
            const img = fixture.nativeElement.querySelector('img');
            expect(img.getAttribute('alt')).toBe('jdoe');
        });
    });

    describe('avatarClasses', () => {
        it('should return md size classes by default', () => {
            expect(component.avatarClasses).toContain('w-8');
        });

        it('should return sm size classes', () => {
            fixture.componentRef.setInput('size', 'sm');
            fixture.detectChanges();
            expect(component.avatarClasses).toContain('w-6');
        });

        it('should return lg size classes', () => {
            fixture.componentRef.setInput('size', 'lg');
            fixture.detectChanges();
            expect(component.avatarClasses).toContain('w-12');
        });

        it('should return xl size classes', () => {
            fixture.componentRef.setInput('size', 'xl');
            fixture.detectChanges();
            expect(component.avatarClasses).toContain('w-16');
        });
    });

    describe('iconSizeClass', () => {
        it('should return text-base for md', () => {
            expect(component.iconSizeClass).toBe('text-base');
        });

        it('should return text-sm for sm', () => {
            fixture.componentRef.setInput('size', 'sm');
            fixture.detectChanges();
            expect(component.iconSizeClass).toBe('text-sm');
        });
    });
});
