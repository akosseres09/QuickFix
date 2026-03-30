import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal, Component } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TabsLayoutComponent } from './tabs-layout.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { Tab } from '../../shared/constants/Tab';
import { UserClaims } from '../../shared/constants/user/Claims';

describe('TabsLayoutComponent', () => {
    let component: TabsLayoutComponent;
    let fixture: ComponentFixture<TabsLayoutComponent>;
    let mockAuthService: jasmine.SpyObj<AuthService>;
    let currentClaimsSignal: WritableSignal<UserClaims | null>;

    const testTabs: Tab[] = [
        { label: 'Overview', route: 'overview' },
        { label: 'Members', route: 'members', permission: 'project.members.view' },
        { label: 'Settings', route: 'settings', permission: 'project.update' },
    ];

    function createUserClaims(permissions: string[] = []): UserClaims {
        return new UserClaims('user-1', { name: 'Developer', value: 1 }, 'test@test.com', {
            base: permissions,
            org: {},
            project: {},
        });
    }

    beforeEach(async () => {
        currentClaimsSignal = signal<UserClaims | null>(null);

        mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
            currentClaimsWithPermissions: currentClaimsSignal,
        });

        await TestBed.configureTestingModule({
            imports: [TabsLayoutComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: mockAuthService },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { data: { tabs: testTabs } } },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TabsLayoutComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('organizationId', 'org-1');
        fixture.componentRef.setInput('projectId', 'proj-1');
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe('tabs initialization', () => {
        it('should load tabs from route data', () => {
            fixture.detectChanges();
            expect(component.tabs().length).toBe(3);
            expect(component.tabs()[0].label).toBe('Overview');
        });

        it('should default to empty tabs if route data has no tabs', async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [TabsLayoutComponent, NoopAnimationsModule],
                providers: [
                    provideRouter([]),
                    provideHttpClient(),
                    provideHttpClientTesting(),
                    { provide: AuthService, useValue: mockAuthService },
                    {
                        provide: ActivatedRoute,
                        useValue: { snapshot: { data: {} } },
                    },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(TabsLayoutComponent);
            f.componentRef.setInput('organizationId', 'org-1');
            f.componentRef.setInput('projectId', 'proj-1');
            f.detectChanges();
            expect(f.componentInstance.tabs().length).toBe(0);
        });
    });

    describe('showTab', () => {
        it('should return false when there is no current user', () => {
            currentClaimsSignal.set(null);
            fixture.detectChanges();
            expect(component.showTab(testTabs[0])).toBeFalse();
        });

        it('should return true for a tab with no permission requirement', () => {
            currentClaimsSignal.set(createUserClaims());
            fixture.detectChanges();
            expect(component.showTab(testTabs[0])).toBeTrue();
        });

        it('should return true when user has the required permission', () => {
            currentClaimsSignal.set(createUserClaims(['project.members.view']));
            fixture.detectChanges();
            expect(component.showTab(testTabs[1])).toBeTrue();
        });

        it('should return false when user lacks the required permission', () => {
            currentClaimsSignal.set(createUserClaims([]));
            fixture.detectChanges();
            expect(component.showTab(testTabs[1])).toBeFalse();
        });

        it('should check permission with correct org and project context', () => {
            const userClaims = createUserClaims([]);
            spyOn(userClaims, 'canDo').and.returnValue(true);
            currentClaimsSignal.set(userClaims);
            fixture.detectChanges();

            component.showTab(testTabs[1]);
            expect(userClaims.canDo).toHaveBeenCalledWith('project.members.view', {
                orgId: 'org-1',
                projectId: 'proj-1',
            });
        });
    });

    describe('template', () => {
        it('should contain a nav element with mat-tab-nav-bar', () => {
            currentClaimsSignal.set(createUserClaims());
            fixture.detectChanges();
            const nav = fixture.nativeElement.querySelector('nav[mat-tab-nav-bar]');
            expect(nav).toBeTruthy();
        });

        it('should render visible tabs as links', () => {
            currentClaimsSignal.set(createUserClaims(['project.members.view', 'project.update']));
            fixture.detectChanges();
            const links = fixture.nativeElement.querySelectorAll('a[mat-tab-link]');
            expect(links.length).toBe(3);
        });

        it('should hide tabs the user lacks permission for', () => {
            currentClaimsSignal.set(createUserClaims([]));
            fixture.detectChanges();
            const links = fixture.nativeElement.querySelectorAll('a[mat-tab-link]');
            // Only the "Overview" tab (no permission required) should show
            expect(links.length).toBe(1);
            expect(links[0].textContent.trim()).toBe('Overview');
        });

        it('should contain a router-outlet', () => {
            fixture.detectChanges();
            const outlet = fixture.nativeElement.querySelector('router-outlet');
            expect(outlet).toBeTruthy();
        });
    });
});
