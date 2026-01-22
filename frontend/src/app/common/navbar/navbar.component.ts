import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { Event, NavigationStart, Router, RouterLink, RouterModule } from '@angular/router';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { AppRoute } from '../../shared/constants/Routes';
import { RouteService } from '../../shared/services/route/route.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
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
    private routeService = inject(RouteService);
    private sidebarService = inject(SidebarService);
    private authService = inject(AuthService);
    private destroyRef = inject(DestroyRef);

    showSidebarToggle = input<boolean>(true);
    sidebarClosed = output<boolean>();
    logoutClicked = output<void>();
    isSidebarCollapsed = signal<boolean>(this.sidebarService.getState());
    isMenuOpen = signal<boolean>(false);
    imageSource: string = 'QuickFix_logo_dark.png';
    user = signal<Claims | null>(this.authService.currentUserClaims());
    htmlElement = signal<HTMLElement | null>(document.documentElement);
    routes = signal<AppRoute[]>(
        this.routeService.getAppRoutes(this.user()).filter((route) => route.show)
    );
    logo = this.themeService.logos;
    theme = signal<'light' | 'dark'>(this.themeService.getTheme() || 'light');

    constructor() {
        this.setTheme(this.theme());
        fromEvent(window, 'resize')
            .pipe(takeUntilDestroyed())
            .subscribe(() => {
                if (window.innerWidth <= 767) {
                    this.isMenuOpen.set(false);
                    this.toggleSidebar(true);
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
            });
    }

    ngAfterViewInit(): void {
        this.htmlElement.set(document.documentElement);
        const el = this.htmlElement();
        if (!el) return;

        el.dataset['theme'] = this.theme();
    }

    setTheme(theme: 'light' | 'dark') {
        if (!this.htmlElement()) return;
        this.themeService.setTheme(theme);
        this.theme.set(theme);
        this.imageSource = this.logo[this.theme()];
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

    toggleSidebar(value: boolean = !this.isSidebarCollapsed()): void {
        this.isSidebarCollapsed.set(value);

        const name = this.isSidebarCollapsed()
            ? this.sidebarService.CLOSED
            : this.sidebarService.OPEN;
        this.sidebarService.setState(name);
        this.sidebarClosed.emit(this.isSidebarCollapsed());
    }

    logout() {
        this.authService
            .logout()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response.success) {
                    this.router.navigate(['/auth/login']);
                }
            });
    }
}
