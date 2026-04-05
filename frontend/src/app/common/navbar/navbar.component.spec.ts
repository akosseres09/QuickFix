import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { Claims } from '../../shared/constants/user/Claims';

describe('NavbarComponent', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;
    let mockAuthService: jasmine.SpyObj<AuthService>;
    let mockThemeService: jasmine.SpyObj<ThemeService>;
    let mockSidebarService: jasmine.SpyObj<SidebarService>;
    let sidebarOpenSignal: WritableSignal<boolean>;

    beforeEach(async () => {
        sidebarOpenSignal = signal<boolean>(true);

        mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
            currentUserClaims: signal<Claims | null>(null),
        });
        mockAuthService.logout.and.returnValue(of({}));

        mockThemeService = jasmine.createSpyObj('ThemeService', ['getTheme', 'setTheme'], {
            logos: { light: 'light.png', dark: 'dark.png' },
        });
        mockThemeService.getTheme.and.returnValue('light');

        mockSidebarService = jasmine.createSpyObj('SidebarService', ['set', 'toggle'], {
            isOpen: sidebarOpenSignal,
        });

        await TestBed.configureTestingModule({
            imports: [NavbarComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: mockAuthService },
                { provide: ThemeService, useValue: mockThemeService },
                { provide: SidebarService, useValue: mockSidebarService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getAppRoutes', () => {
        it('should show Login and Sign Up when user is null', () => {
            const routes = component.getAppRoutes();
            const loginRoute = routes.find((r) => r.name === 'Login');
            const signUpRoute = routes.find((r) => r.name === 'Sign Up');
            expect(loginRoute?.show).toBeTrue();
            expect(signUpRoute?.show).toBeTrue();
        });

        it('should hide Login and Sign Up when user is logged in', () => {
            component.user.set({ uid: 'u-1', role: { name: 'Dev', value: 1 }, email: 'a@b.com' });
            const routes = component.getAppRoutes();
            const loginRoute = routes.find((r) => r.name === 'Login');
            expect(loginRoute?.show).toBeFalse();
        });

        it('should show Account menu when user is logged in', () => {
            component.user.set({ uid: 'u-1', role: { name: 'Dev', value: 1 }, email: 'a@b.com' });
            const routes = component.getAppRoutes();
            const accountRoute = routes.find((r) => r.name === 'Account');
            expect(accountRoute?.show).toBeTrue();
        });
    });

    describe('setTheme', () => {
        it('should call themeService.setTheme', () => {
            component.setTheme('dark');
            expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark');
        });

        it('should update the theme signal', () => {
            component.setTheme('dark');
            expect(component.theme()).toBe('dark');
        });
    });

    describe('toggleMenu', () => {
        it('should toggle isMenuOpen signal', () => {
            expect(component.isMenuOpen()).toBeFalse();
            component.toggleMenu();
            expect(component.isMenuOpen()).toBeTrue();
            component.toggleMenu();
            expect(component.isMenuOpen()).toBeFalse();
        });
    });

    describe('onToggle', () => {
        it('should set theme for valid values', () => {
            component.onToggle({ value: 'dark' } as any);
            expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark');
        });

        it('should ignore invalid theme values', () => {
            mockThemeService.setTheme.calls.reset();
            component.onToggle({ value: 'invalid' } as any);
            expect(mockThemeService.setTheme).not.toHaveBeenCalled();
        });
    });

    describe('toggleSidebar', () => {
        it('should toggle the sidebar via service', () => {
            component.toggleSidebar(false);
            expect(mockSidebarService.set).toHaveBeenCalledWith(false);
            expect(component.isSidebarOpened()).toBeFalse();
        });
    });

    describe('template', () => {
        it('should render a nav element', () => {
            expect(fixture.nativeElement.querySelector('nav')).toBeTruthy();
        });
    });
});
