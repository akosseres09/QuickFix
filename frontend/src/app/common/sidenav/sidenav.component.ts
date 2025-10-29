import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AppRoute } from '../../shared/constants/Routes';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { RouteService } from '../../shared/services/route/route.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import {
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatPrefix } from '@angular/material/input';

@Component({
    selector: 'app-sidenav',
    imports: [
        CommonModule,
        RouterLink,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatIcon,
        RouterLinkActive,
        MatPrefix,
    ],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.css',
})
export class SidenavComponent implements OnInit, OnChanges {
    @Input() isCollapsed: boolean = false;
    routes: Array<AppRoute> = [];
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
    }

    toggleMenu(menuName: string): void {
        if (this.isCollapsed) {
            this.isCollapsed = false;
        }
    }
}
