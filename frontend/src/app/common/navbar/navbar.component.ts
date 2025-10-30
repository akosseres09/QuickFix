import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    MatButtonToggle,
    MatButtonToggleChange,
    MatButtonToggleGroup,
} from '@angular/material/button-toggle';
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
        MatButtonToggle,
        MatButtonToggleGroup,
        MatMenu,
        MatMenuTrigger,
        MatMenuItem,
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css',
    standalone: true,
})
export class NavbarComponent implements OnInit, AfterViewInit {
    @Output() sidebarClosed: EventEmitter<boolean> = new EventEmitter<boolean>();
    isSidebarCollapsed: boolean;
    isMenuOpen = false;
    imageSource: string = 'QuickFix_logo_dark.png';
    theme: 'light' | 'dark' = 'light';
    logo;

    user: User | null = null;

    htmlElement: HTMLElement | null = null;
    routes: Array<AppRoute> = [];

    ngOnInit(): void {
        this.user = this.userService.getUser();
        this.htmlElement = document.documentElement;

        let theme: 'light' | 'dark' = this.themeService.getTheme();
        this.setTheme(!theme ? 'light' : (theme as 'light' | 'dark'));

        this.routes = this.routeService.getAppRoutes(this.user).filter((route) => route.show);
    }

    constructor(
        private themeService: ThemeService,
        private router: Router,
        private routeService: RouteService,
        private sidebarService: SidebarService,
        private userService: UserService
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
