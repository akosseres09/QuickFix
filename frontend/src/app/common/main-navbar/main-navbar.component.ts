import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
    MatButtonToggle,
    MatButtonToggleChange,
    MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { RouteService } from '../../shared/services/route/route.service';
import { AppRoute } from '../../shared/constants/Routes';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';

@Component({
    selector: 'app-main-navbar',
    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        MatMenu,
        MatMenuTrigger,
        MatIcon,
        MatButtonToggleGroup,
        MatButtonToggle,
        MatMenuItem,
    ],
    templateUrl: './main-navbar.component.html',
    styleUrl: './main-navbar.component.css',
})
export class MainNavbarComponent {
    @Output() sidebarClosed: EventEmitter<boolean> = new EventEmitter<boolean>();
    imageSource: string = 'QuickFix_logo_dark.png';
    isMenuOpen = false;
    theme: 'light' | 'dark' = 'light';
    logo;
    isSidebarCollapsed: boolean;

    htmlElement: HTMLElement | null = null;
    routes: Array<AppRoute> = [];

    ngOnInit(): void {
        this.htmlElement = document.documentElement;

        let theme: 'light' | 'dark' = this.themeService.getTheme();
        this.setTheme(!theme ? 'light' : (theme as 'light' | 'dark'));

        this.routes = this.routeService.getMainAppRoutes();
    }

    constructor(
        private themeService: ThemeService,
        private router: Router,
        private routeService: RouteService,
        private sidebarService: SidebarService
    ) {
        this.isSidebarCollapsed = this.sidebarService.getState();
        this.logo = themeService.logos;
    }

    ngAfterViewInit(): void {
        this.htmlElement = document.documentElement;
        if (!this.htmlElement) return;

        const theme = localStorage.getItem('theme') || 'light';
        this.htmlElement.dataset['theme'] = theme;
    }

    setTheme(theme: 'light' | 'dark') {
        if (!this.htmlElement) return;

        this.themeService.setTheme(theme);
        this.theme = theme;
        this.imageSource = this.logo[this.theme];
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    onToggle(event: MatButtonToggleChange) {
        if (!this.htmlElement) return;

        if (['light', 'dark'].indexOf(event.value) === -1) {
            return;
        }

        this.setTheme(event.value);
    }

    navigateTo(path: string) {
        this.router.navigateByUrl(path);
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        const name = this.isSidebarCollapsed
            ? this.sidebarService.CLOSED
            : this.sidebarService.OPEN;
        this.sidebarService.setState(name);
        this.sidebarClosed.emit(this.isSidebarCollapsed);
    }
}
