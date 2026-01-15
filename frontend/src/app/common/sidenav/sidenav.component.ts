import { Component, inject, model, signal } from '@angular/core';
import { AppRoute } from '../../shared/constants/Routes';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { RouteService } from '../../shared/services/route/route.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { NavitemComponent } from './navitem/navitem.component';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { matchProjectRoutes } from '../../shared/constants/RouteMatch';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-sidenav',
    imports: [NavitemComponent],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.css',
})
export class SidenavComponent {
    private themeService = inject(ThemeService);
    private routeService = inject(RouteService);
    private sidebarService = inject(SidebarService);
    private router = inject(Router);

    isCollapsed = model<boolean>(this.sidebarService.getState());
    topRoutes = model<AppRoute[]>(this.routeService.getSidenavRoutes());
    bottomRoutes = signal<AppRoute[]>(this.routeService.getBottomSidenavRoutes());
    theme = signal<'light' | 'dark'>(this.themeService.getTheme());
    logo = signal<string>(this.themeService.logos[this.theme()]);

    constructor() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed()
            )
            .subscribe((event: NavigationEnd) => {
                if (event.url.match(matchProjectRoutes)) {
                    this.topRoutes.set(this.routeService.getSidenavRoutes());
                }
            });
    }

    toggleSidebar(): void {
        this.isCollapsed.set(!this.isCollapsed());
    }
}
