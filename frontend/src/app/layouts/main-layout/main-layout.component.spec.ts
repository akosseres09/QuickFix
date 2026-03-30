import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, input, signal, WritableSignal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { OrganizationService } from '../../shared/services/organization/organization.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { Organization } from '../../shared/model/Organization';
import { UserClaims } from '../../shared/constants/user/Claims';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { NavitemComponent } from '../../common/sidenav/navitem/navitem.component';
import { SidenavRoute } from '../../shared/constants/route/Routes';

// Stub child components to isolate the layout
@Component({
    selector: 'app-navbar',
    template: '',
    standalone: true,
})
class StubNavbarComponent {
    // Add the inputs that BaseLayoutComponent is trying to bind to
    showSidebarToggleButton = input<boolean>(false);
    showBaseRoutes = input<boolean>(false);
}

@Component({ selector: 'app-navitem', template: '', standalone: true, inputs: ['routes'] })
class StubNavitemComponent {
    routes = input<Array<SidenavRoute>>([]);
    isCollapsed = input<boolean>(false);
}

describe('MainLayoutComponent', () => {
    let component: MainLayoutComponent;
    let fixture: ComponentFixture<MainLayoutComponent>;
    let mockAuthService: jasmine.SpyObj<AuthService>;
    let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
    let mockOrgService: jasmine.SpyObj<OrganizationService>;
    let mockThemeService: jasmine.SpyObj<ThemeService>;
    let mockSidebarService: jasmine.SpyObj<SidebarService>;
    let router: Router;
    let currentClaimsSignal: WritableSignal<UserClaims | null>;
    let sidebarOpenSignal: WritableSignal<boolean>;

    const mockOrg: Organization = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        description: null,
        logoUrl: 'https://example.com/logo.png',
        ownerId: 'user-1',
        createdAt: 1000,
        updatedAt: 2000,
        updatedBy: null,
        deletedAt: null,
    };

    function createUserClaims(
        basePerms: string[] = [],
        orgPerms: Record<string, string[]> = {},
        projectPerms: Record<string, string[]> = {}
    ): UserClaims {
        return new UserClaims('user-1', { name: 'Developer', value: 1 }, 'test@test.com', {
            base: basePerms,
            org: orgPerms,
            project: projectPerms,
        });
    }

    beforeEach(async () => {
        currentClaimsSignal = signal<UserClaims | null>(null);
        sidebarOpenSignal = signal<boolean>(true);

        mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
            currentClaimsWithPermissions: currentClaimsSignal,
            currentUserClaims: signal(null),
        });
        mockAuthService.logout.and.returnValue(of({}));

        mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['error', 'open']);
        mockOrgService = jasmine.createSpyObj('OrganizationService', ['getOrganization']);
        mockOrgService.getOrganization.and.returnValue(of(mockOrg));

        mockThemeService = jasmine.createSpyObj('ThemeService', ['getTheme', 'setTheme'], {
            logos: { light: 'light.png', dark: 'dark.png' },
        });
        mockThemeService.getTheme.and.returnValue('light');

        mockSidebarService = jasmine.createSpyObj('SidebarService', ['set', 'toggle'], {
            isOpen: sidebarOpenSignal,
        });

        await TestBed.configureTestingModule({
            imports: [MainLayoutComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: mockAuthService },
                { provide: SnackbarService, useValue: mockSnackbarService },
                { provide: OrganizationService, useValue: mockOrgService },
                { provide: ThemeService, useValue: mockThemeService },
                { provide: SidebarService, useValue: mockSidebarService },
            ],
        })
            .overrideComponent(MainLayoutComponent, {
                remove: { imports: [NavbarComponent, NavitemComponent] },
                add: { imports: [StubNavbarComponent, StubNavitemComponent] },
            })
            .compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

        fixture = TestBed.createComponent(MainLayoutComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('organizationId', 'org-1');
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should fetch organization when organizationId is set', () => {
            fixture.detectChanges();
            expect(mockOrgService.getOrganization).toHaveBeenCalledWith('org-1');
        });

        it('should set the organization signal on success', () => {
            fixture.detectChanges();
            expect(component.organization()).toEqual(mockOrg);
        });

        it('should show error and navigate if getOrganization fails', () => {
            mockOrgService.getOrganization.and.returnValue(throwError(() => new Error('fail')));
            fixture.detectChanges();
            expect(mockSnackbarService.error).toHaveBeenCalledWith('Failed to load organization!');
            expect(router.navigate).toHaveBeenCalledWith(['/organizations']);
        });

        it('should set bottom sidenav routes', () => {
            fixture.detectChanges();
            expect(component.bottomSidenavRoutes().length).toBeGreaterThan(0);
        });
    });

    describe('getOrganization', () => {
        it('should show error and navigate when organizationId is empty', () => {
            fixture.componentRef.setInput('organizationId', '');
            fixture.detectChanges();
            component.getOrganization();
            expect(mockSnackbarService.error).toHaveBeenCalledWith('No organization selected!');
            expect(router.navigate).toHaveBeenCalledWith(['/organizations']);
        });
    });

    describe('onSidebarOpenedChange', () => {
        it('should update isSidebarOpened signal', () => {
            fixture.detectChanges();
            component.onSidebarOpenedChange(false);
            expect(component.isSidebarOpened()).toBeFalse();
            component.onSidebarOpenedChange(true);
            expect(component.isSidebarOpened()).toBeTrue();
        });

        it('should persist state via SidebarService when in side mode', () => {
            fixture.detectChanges();
            component['sidebarMode'].set('side');
            component.onSidebarOpenedChange(false);
            expect(mockSidebarService.set).toHaveBeenCalledWith(false);
        });

        it('should not persist state when in over mode', () => {
            fixture.detectChanges();
            component['sidebarMode'].set('over');
            mockSidebarService.set.calls.reset();
            component.onSidebarOpenedChange(false);
            expect(mockSidebarService.set).not.toHaveBeenCalled();
        });
    });

    describe('getSidenavRoutes', () => {
        it('should return base routes when no organization is loaded', () => {
            fixture.detectChanges();
            // Clear org after ngOnInit has already set it
            component.organization.set(null);
            const routes = component.getSidenavRoutes();
            expect(routes.length).toBe(2);
            expect(routes[0].name).toBe('Organizations');
            expect(routes[1].name).toBe('Invitations');
        });

        it('should return expanded routes when organization is set', () => {
            component.organization.set(mockOrg);
            fixture.detectChanges();
            const routes = component.getSidenavRoutes();
            expect(routes.length).toBeGreaterThan(2);
            const orgRoute = routes.find((r) => r.name === 'Test Org');
            expect(orgRoute).toBeTruthy();
        });

        it('should include project-related routes when projectId is set', () => {
            component.organization.set(mockOrg);
            component.projectId.set('proj-1');
            fixture.detectChanges();
            const routes = component.getSidenavRoutes();
            const issuesRoute = routes.find((r) => r.name === 'Issues');
            expect(issuesRoute).toBeTruthy();
            const projectsRoute = routes.find((r) => r.name === 'Projects');
            expect(projectsRoute).toBeTruthy();
        });

        it('should not include project-specific routes when projectId is null', () => {
            component.organization.set(mockOrg);
            component.projectId.set(null);
            fixture.detectChanges();
            const routes = component.getSidenavRoutes();
            const issuesRoute = routes.find((r) => r.name === 'Issues');
            expect(issuesRoute).toBeUndefined();
        });

        it('should include Create Issue when user has issue.create permission', () => {
            currentClaimsSignal.set(createUserClaims([], {}, { 'proj-1': ['issue.create'] }));
            component.organization.set(mockOrg);
            component.projectId.set('proj-1');
            fixture.detectChanges();
            const routes = component.getSidenavRoutes();
            const issuesRoute = routes.find((r) => r.name === 'Issues');
            const createChild = issuesRoute?.children?.find((c) => c.name === 'Create Issue');
            expect(createChild).toBeTruthy();
        });

        it('should not include Create Issue when user lacks permission', () => {
            currentClaimsSignal.set(createUserClaims([]));
            component.organization.set(mockOrg);
            component.projectId.set('proj-1');
            fixture.detectChanges();
            const routes = component.getSidenavRoutes();
            const issuesRoute = routes.find((r) => r.name === 'Issues');
            const createChild = issuesRoute?.children?.find((c) => c.name === 'Create Issue');
            expect(createChild).toBeUndefined();
        });

        it('should include Labels when user has project.update permission', () => {
            currentClaimsSignal.set(createUserClaims([], {}, { 'proj-1': ['project.update'] }));
            component.organization.set(mockOrg);
            component.projectId.set('proj-1');
            fixture.detectChanges();
            const routes = component.getSidenavRoutes();
            const manageRoute = routes.find((r) => r.name === 'Manage');
            const labelsChild = manageRoute?.children?.find((c) => c.name === 'Labels');
            expect(labelsChild).toBeTruthy();
        });

        it('should include Time Tracking route', () => {
            component.organization.set(mockOrg);
            fixture.detectChanges();
            const routes = component.getSidenavRoutes();
            const timeRoute = routes.find((r) => r.name === 'Time Tracking');
            expect(timeRoute).toBeTruthy();
        });
    });

    describe('getBottomSidenavRoutes', () => {
        it('should return Account menu with Profile, Settings, and Logout children', () => {
            fixture.detectChanges();
            const routes = component.getBottomSidenavRoutes();
            expect(routes.length).toBe(1);
            expect(routes[0].name).toBe('Account');
            expect(routes[0].children!.length).toBe(3);

            const childNames = routes[0].children!.map((c) => c.name);
            expect(childNames).toContain('Profile');
            expect(childNames).toContain('Settings');
            expect(childNames).toContain('Logout');
        });
    });

    describe('logout', () => {
        it('should call authService.logout and navigate to login on success', () => {
            fixture.detectChanges();
            component.logout();
            expect(mockAuthService.logout).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        });

        it('should show snackbar error on logout failure', () => {
            mockAuthService.logout.and.returnValue(throwError(() => new Error('fail')));
            fixture.detectChanges();
            component.logout();
            expect(mockSnackbarService.open).toHaveBeenCalledWith('Failed to log out!', [
                'snackbar-error',
            ]);
        });
    });

    describe('template', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should contain a mat-sidenav-container', () => {
            const container = fixture.nativeElement.querySelector('mat-sidenav-container');
            expect(container).toBeTruthy();
        });

        it('should contain a mat-sidenav', () => {
            const sidenav = fixture.nativeElement.querySelector('mat-sidenav');
            expect(sidenav).toBeTruthy();
        });

        it('should render app-navbar', () => {
            const navbar = fixture.nativeElement.querySelector('app-navbar');
            expect(navbar).toBeTruthy();
        });

        it('should render app-navitem components', () => {
            const navitems = fixture.nativeElement.querySelectorAll('app-navitem');
            expect(navitems.length).toBeGreaterThanOrEqual(2);
        });

        it('should contain a router-outlet', () => {
            const outlet = fixture.nativeElement.querySelector('router-outlet');
            expect(outlet).toBeTruthy();
        });

        it('should display QuickFix branding in the sidenav', () => {
            const brandText = fixture.nativeElement.querySelector('mat-sidenav span');
            expect(brandText?.textContent?.trim()).toBe('QuickFix');
        });
    });
});
