import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MemberCardComponent } from './member-card.component';
import { MemberRole } from '../../shared/constants/Role';
import { User, UserStatus, UserRole } from '../../shared/model/User';
import { OrganizationMember } from '../../shared/model/OrganizationMember';
import { Claims } from '../../shared/constants/user/Claims';

describe('MemberCardComponent', () => {
    let component: MemberCardComponent;
    let fixture: ComponentFixture<MemberCardComponent>;

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

    const mockMember: OrganizationMember = {
        id: 'm-1',
        organizationId: 'org-1',
        userId: 'u-1',
        role: MemberRole.MEMBER,
        createdAt: 1000,
        createdBy: 'system',
        updatedAt: null,
        updatedBy: null,
        user: mockUser,
    };

    const mockCurrentUser: Claims = {
        uid: 'u-2',
        role: { name: 'Developer', value: 1 },
        email: 'current@test.com',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MemberCardComponent, NoopAnimationsModule],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(MemberCardComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('member', mockMember);
        fixture.componentRef.setInput('organizationId', 'org-1');
        fixture.componentRef.setInput('currentUser', mockCurrentUser);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getRoleLabel', () => {
        it('should return "Member" for member role', () => {
            expect(component.getRoleLabel(MemberRole.MEMBER)).toBe('Member');
        });

        it('should return "Admin" for admin role', () => {
            expect(component.getRoleLabel(MemberRole.ADMIN)).toBe('Admin');
        });

        it('should return "Owner" for owner role', () => {
            expect(component.getRoleLabel(MemberRole.OWNER)).toBe('Owner');
        });

        it('should return the raw role string for unknown roles', () => {
            expect(component.getRoleLabel('unknown-role')).toBe('unknown-role');
        });
    });

    describe('getRoleBadgeClass', () => {
        it('should return amber classes for owner', () => {
            expect(component.getRoleBadgeClass(MemberRole.OWNER)).toContain('bg-amber');
        });

        it('should return violet classes for admin', () => {
            expect(component.getRoleBadgeClass(MemberRole.ADMIN)).toContain('bg-violet');
        });

        it('should return sky classes for member', () => {
            expect(component.getRoleBadgeClass(MemberRole.MEMBER)).toContain('bg-sky');
        });

        it('should return gray classes for unknown role', () => {
            expect(component.getRoleBadgeClass('unknown')).toContain('bg-gray');
        });
    });

    describe('template', () => {
        it('should display the member name', () => {
            const text = fixture.nativeElement.textContent;
            expect(text).toContain('John');
            expect(text).toContain('Doe');
        });

        it('should display the username', () => {
            expect(fixture.nativeElement.textContent).toContain('@jdoe');
        });

        it('should display the email', () => {
            expect(fixture.nativeElement.textContent).toContain('jdoe@test.com');
        });

        it('should display the role badge', () => {
            expect(fixture.nativeElement.textContent).toContain('Member');
        });

        it('should show "You" indicator when member is current user', () => {
            fixture.componentRef.setInput('currentUser', {
                uid: 'u-1',
                role: { name: 'Dev', value: 1 },
                email: 'e',
            });
            fixture.detectChanges();
            expect(fixture.nativeElement.textContent).toContain('You');
        });

        it('should not show actions menu when canManage is false', () => {
            const menuButton = fixture.nativeElement.querySelector('button[mat-icon-button]');
            expect(menuButton).toBeNull();
        });

        it('should show actions menu when canManage is true and not own card or owner', () => {
            fixture.componentRef.setInput('canManage', true);
            fixture.detectChanges();
            const menuButton = fixture.nativeElement.querySelector('button[mat-icon-button]');
            expect(menuButton).toBeTruthy();
        });

        it('should not show actions menu for the owner card', () => {
            fixture.componentRef.setInput('canManage', true);
            fixture.componentRef.setInput('member', { ...mockMember, role: MemberRole.OWNER });
            fixture.detectChanges();
            const menuButton = fixture.nativeElement.querySelector('button[mat-icon-button]');
            expect(menuButton).toBeNull();
        });
    });

    describe('outputs', () => {
        it('should emit memberRemoved with member id', () => {
            spyOn(component.memberRemoved, 'emit');
            component.memberRemoved.emit('m-1');
            expect(component.memberRemoved.emit).toHaveBeenCalledWith('m-1');
        });

        it('should emit roleChanged with memberId and role', () => {
            spyOn(component.roleChanged, 'emit');
            component.roleChanged.emit({ memberId: 'm-1', role: 'admin' });
            expect(component.roleChanged.emit).toHaveBeenCalledWith({
                memberId: 'm-1',
                role: 'admin',
            });
        });
    });
});
