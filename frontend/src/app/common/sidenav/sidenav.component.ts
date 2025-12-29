import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AppRoute } from '../../shared/constants/Routes';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { RouteService } from '../../shared/services/route/route.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { NavitemComponent } from './navitem/navitem.component';

@Component({
    selector: 'app-sidenav',
    imports: [NavitemComponent],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.css',
})
export class SidenavComponent implements OnInit, OnChanges {
    @Input() isCollapsed: boolean = false;
    @Input() topRoutes: Array<AppRoute> = [];
    bottomRoutes: Array<AppRoute> = [];
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
        if (this.topRoutes.length === 0) {
            this.topRoutes = this.routeService.getSidenavRoutes();
        }
        this.bottomRoutes = this.routeService.getBottomSidenavRoutes();
        this.logo = this.themeService.logos[this.theme];
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.isCollapsed = changes['isCollapsed'].currentValue;
    }

    toggleSidebar(): void {
        this.isCollapsed = !this.isCollapsed;
    }
}
