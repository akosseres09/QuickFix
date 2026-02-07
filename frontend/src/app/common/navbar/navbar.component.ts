import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    DestroyRef,
    inject,
    input,
    model,
    output,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { Event, NavigationStart, Router, RouterLink, RouterModule } from '@angular/router';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { AppRoute } from '../../shared/constants/Routes';
import { filter, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Claims } from '../../shared/constants/Claims';
import { AuthService } from '../../shared/services/auth/auth.service';

@Component({
    selector: 'app-navbar',
    imports: [
        RouterModule,
        CommonModule,
        RouterLink,
        FormsModule,
        MatIcon,
        MatMenu,
        MatMenuTrigger,
        MatMenuItem,
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css',
    standalone: true,
})
export class NavbarComponent implements AfterViewInit {
    private themeService = inject(ThemeService);
    private router = inject(Router);
    private authService = inject(AuthService);
    private destroyRef = inject(DestroyRef);

    isSidebarOpened = model<boolean>(window.innerWidth > 767);
    imageSource = model<string>('QuickFix_logo_dark.png');
    logoutClicked = output<void>();
    showMenuLogo = input<boolean>(true);

    isMenuOpen = signal<boolean>(false);
    user = signal<Claims | null>(this.authService.currentUserClaims());
    htmlElement = signal<HTMLElement | null>(document.documentElement);
    routes = signal<AppRoute[]>(this.getAppRoutes().filter((route) => route.show));
    theme = signal<'light' | 'dark'>(this.themeService.getTheme() || 'light');
    showSidebarToggleButton = signal<boolean>(window.innerWidth <= 767);
    logo = this.themeService.logos;

    constructor() {
        this.setTheme(this.theme());
        fromEvent(window, 'resize')
            .pipe(takeUntilDestroyed())
            .subscribe(() => {
                if (window.innerWidth <= 767) {
                    this.showSidebarToggleButton.set(true);
                    this.isMenuOpen.set(false);
                    this.isSidebarOpened.set(false);
                } else {
                    this.showSidebarToggleButton.set(false);
                    this.isSidebarOpened.set(true);
                }
            });

        this.router.events
            .pipe(
                filter(
                    (event: Event): event is NavigationStart => event instanceof NavigationStart
                ),
                takeUntilDestroyed()
            )
            .subscribe(() => {
                this.isMenuOpen.set(false);
                if (window.innerWidth <= 767) {
                    this.isSidebarOpened.set(false);
                }
            });
    }

    ngAfterViewInit(): void {
        this.htmlElement.set(document.documentElement);
        const el = this.htmlElement();
        if (!el) return;

        el.dataset['theme'] = this.theme();
    }

    getAppRoutes(): Array<AppRoute> {
        return [
            {
                path: '/auth/login',
                name: 'Login',
                type: 'button',
                show: this.user() === null,
            },
            {
                path: '/auth/signup',
                name: 'Sign Up',
                type: 'button',
                show: this.user() === null,
            },
            {
                path: '',
                name: 'Home',
                type: 'button',
                show: this.user() === null,
                exact: true,
            },
            {
                path: '/projects',
                name: 'Projects',
                type: 'button',
                show: this.user() !== null,
            },
            {
                path: '/worktime',
                name: 'Worktime',
                type: 'button',
                show: this.user() !== null,
            },
            {
                type: 'menu',
                show: this.user() !== null,
                name: 'Account',
                icon: 'account_circle',
                children: [
                    {
                        name: 'Account',
                        path: '/account',
                        icon: 'person',
                    },
                    {
                        name: 'Settings',
                        path: '/settings',
                        icon: 'settings',
                    },
                ],
            },
        ];
    }

    setTheme(theme: 'light' | 'dark') {
        if (!this.htmlElement()) return;
        this.themeService.setTheme(theme);
        this.theme.set(theme);
        this.imageSource.set(this.logo[this.theme()]);
    }

    toggleMenu() {
        this.isMenuOpen.set(!this.isMenuOpen());
    }

    onToggle(event: MatButtonToggleChange) {
        if (!this.htmlElement()) return;

        if (['light', 'dark'].indexOf(event.value) === -1) {
            return;
        }

        this.setTheme(event.value);
    }

    toggleSidebar(value: boolean = !this.isSidebarOpened()): void {
        console.log('toggled');

        this.isSidebarOpened.set(value);
    }

    logout() {
        this.authService
            .logout()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.router.navigate(['/auth/login']);
            });
    }
}
