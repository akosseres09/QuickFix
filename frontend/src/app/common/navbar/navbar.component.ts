import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { AppRoute } from '../../shared/constants/Routes';
import { RouteService } from '../../shared/services/route/route.service';
import { User } from '../../shared/model/User';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { UserService } from '../../shared/services/user/user.service';

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
export class NavbarComponent implements OnInit, AfterViewInit {
    showSidebarToggle = input<boolean>(true);
    sidebarClosed = output<boolean>();
    isSidebarCollapsed = signal<boolean>(false);
    isMenuOpen = signal<boolean>(false);
    imageSource: string = 'QuickFix_logo_dark.png';
    user = signal<User | null>(null);
    htmlElement = signal<HTMLElement | null>(null);
    routes = signal<AppRoute[]>([]);
    logo;

    private themeService = inject(ThemeService);
    private router = inject(Router);
    private routeService = inject(RouteService);
    private sidebarService = inject(SidebarService);
    private userService = inject(UserService);

    theme = signal<'light' | 'dark'>(this.themeService.getTheme() || 'light');

    ngOnInit(): void {
        this.user.set(this.userService.getUser());
        this.htmlElement.set(document.documentElement);
        this.setTheme(this.theme());
        this.routes.set(this.routeService.getAppRoutes(this.user()).filter((route) => route.show));
    }

    constructor() {
        this.isSidebarCollapsed.set(this.sidebarService.getState());
        this.logo = this.themeService.logos;
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

    navigateTo(path: string) {
        this.router.navigateByUrl(path);
    }

    toggleSidebar() {
        this.isSidebarCollapsed.set(!this.isSidebarCollapsed());

        const name = this.isSidebarCollapsed()
            ? this.sidebarService.CLOSED
            : this.sidebarService.OPEN;
        this.sidebarService.setState(name);
        this.sidebarClosed.emit(this.isSidebarCollapsed());
    }
}
