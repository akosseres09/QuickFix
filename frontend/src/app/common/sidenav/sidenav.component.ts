import { Component, inject, model, OnDestroy, OnInit, signal } from '@angular/core';
import { AppRoute } from '../../shared/constants/Routes';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { RouteService } from '../../shared/services/route/route.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { NavitemComponent } from './navitem/navitem.component';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { matchProjectRoutes } from '../../shared/constants/RouteMatch';

@Component({
    selector: 'app-sidenav',
    imports: [NavitemComponent],
    templateUrl: './sidenav.component.html',
    styleUrl: './sidenav.component.css',
})
export class SidenavComponent implements OnInit, OnDestroy {
    isCollapsed = model<boolean>(false);
    topRoutes = model<AppRoute[]>([]);
    bottomRoutes = signal<AppRoute[]>([]);
    logo = signal<string>('');
    theme = signal<'light' | 'dark'>('light');

    private themeService = inject(ThemeService);
    private routeService = inject(RouteService);
    private sidebarService = inject(SidebarService);
    private router = inject(Router);
    private navigationSubscription: Subscription | null = null;

    ngOnInit(): void {
        this.navigationSubscription = this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                if (event.url.match(matchProjectRoutes)) {
                    this.topRoutes.set(this.routeService.getSidenavRoutes());
                }
            });

        this.theme.set(this.themeService.getTheme());
        this.isCollapsed.set(this.sidebarService.getState());
        this.topRoutes.set(this.routeService.getSidenavRoutes());
        this.bottomRoutes.set(this.routeService.getBottomSidenavRoutes());
        this.logo.set(this.themeService.logos[this.theme()]);
    }

    ngOnDestroy(): void {
        this.navigationSubscription?.unsubscribe();
    }

    toggleSidebar(): void {
        this.isCollapsed.set(!this.isCollapsed());
    }
}
