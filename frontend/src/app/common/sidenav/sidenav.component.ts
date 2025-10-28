import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AppRoute } from '../../shared/constants/Routes';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { RouteService } from '../../shared/services/route/route.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';

@Component({
    selector: 'app-sidenav',
    imports: [CommonModule, RouterLink],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.css',
})
export class SidenavComponent implements OnInit, OnChanges {
    @Input() isCollapsed: boolean = false;

    routes: Array<AppRoute> = [];
    openMenus: Set<string> = new Set();
    logo: string = '';
    theme: string = '';

    constructor(
        private themeService: ThemeService,
        private routeService: RouteService,
        private sidebarService: SidebarService
    ) {
        this.theme = this.themeService.getTheme();
        this.isCollapsed = this.sidebarService.getState();
    }

    ngOnInit(): void {
        this.routes = this.routeService.getSidenavRoutes();
        this.logo = this.themeService.logos[this.theme];
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.isCollapsed = changes['isCollapsed'].currentValue;
    }

    toggleSidebar(): void {
        this.isCollapsed = !this.isCollapsed;
        if (this.isCollapsed) {
            this.openMenus.clear();
        }
    }

    toggleMenu(menuName: string): void {
        if (this.isCollapsed) {
            this.isCollapsed = false;
        }

        if (this.openMenus.has(menuName)) {
            this.openMenus.delete(menuName);
        } else {
            this.openMenus.add(menuName);
        }
    }

    isMenuOpen(menuName: string): boolean {
        return this.openMenus.has(menuName);
    }
}
