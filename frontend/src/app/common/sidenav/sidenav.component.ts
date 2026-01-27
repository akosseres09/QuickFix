import { Component, inject, model, signal } from '@angular/core';
import { AppRoute } from '../../shared/constants/Routes';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { NavitemComponent } from './navitem/navitem.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
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
    private sidebarService = inject(SidebarService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);

    projectId = this.activatedRoute.snapshot.paramMap.get('projectId');
    isCollapsed = model<boolean>(this.sidebarService.getState());
    topRoutes = model<AppRoute[]>(this.getSideNavRoutes());
    bottomRoutes = signal<AppRoute[]>([]);
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
                    this.topRoutes.set(this.getSideNavRoutes());
                }
            });
    }

    toggleSidebar(): void {
        this.isCollapsed.set(!this.isCollapsed());
    }

    getSideNavRoutes(): Array<AppRoute> {
        return [
            {
                name: 'Issues',
                type: 'menu',
                icon: 'report_problem',
                path: `/project/${this.projectId}/issues`,
                children: [
                    {
                        name: 'Overview',
                        path: `/project/${this.projectId}/issues/overview`,
                        icon: 'travel_explore',
                    },
                    {
                        name: 'Issues',
                        path: `/project/${this.projectId}/issues`,
                        icon: 'assignment',
                    },
                    {
                        name: 'Board',
                        path: `/project/${this.projectId}/issues/board`,
                        icon: 'space_dashboard',
                    },
                    {
                        name: 'New Issue',
                        path: `/project/${this.projectId}/issues/new`,
                        icon: 'add_task',
                    },
                ],
            },
            {
                name: 'Labels',
                type: 'button',
                icon: 'label',
                path: `/project/${this.projectId}/labels`,
            },
        ];
    }
}
