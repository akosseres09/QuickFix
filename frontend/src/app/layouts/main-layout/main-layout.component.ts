import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { AppRoute } from '../../shared/constants/Routes';
import { NavitemComponent } from '../../common/sidenav/navitem/navitem.component';
import { ThemeService } from '../../shared/services/theme/theme.service';

@Component({
    selector: 'app-main-layout',
    imports: [
        NavbarComponent,
        RouterModule,
        MatSidenavContainer,
        MatSidenav,
        MatSidenavContent,
        NavitemComponent,
    ],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
    private sidebarService = inject(SidebarService);
    private activeRoute = inject(ActivatedRoute);
    private themeService = inject(ThemeService);
    isSidebarOpened = signal<boolean>(this.sidebarService.getState());
    projectId = signal<string | null>(this.activeRoute.snapshot.paramMap.get('projectId'));
    sideNavRoutes = signal<AppRoute[]>(this.getSideNavRoutes());
    imageSource = signal<string>(this.themeService.logos[this.themeService.getTheme()]);

    onSidebar(event: boolean) {
        this.setSidebarState(event);
    }

    setSidebarState(open: boolean): void {
        const collapsedState = open ? 'open' : 'closed';
        this.sidebarService.setState(collapsedState);
        this.isSidebarOpened.set(open);
    }

    getSideNavRoutes(): Array<AppRoute> {
        return [
            {
                name: 'Issues',
                type: 'menu',
                icon: 'report_problem',
                path: `/project/${this.projectId()}/issues`,
                children: [
                    {
                        name: 'Overview',
                        path: `/project/${this.projectId()}/issues/overview`,
                        icon: 'travel_explore',
                    },
                    {
                        name: 'Issues',
                        path: `/project/${this.projectId()}/issues`,
                        icon: 'assignment',
                    },
                    {
                        name: 'Board',
                        path: `/project/${this.projectId()}/issues/board`,
                        icon: 'space_dashboard',
                    },
                    {
                        name: 'New Issue',
                        path: `/project/${this.projectId()}/issues/new`,
                        icon: 'add_task',
                    },
                ],
            },
            {
                name: 'Labels',
                type: 'button',
                icon: 'label',
                path: `/project/${this.projectId()}/labels`,
            },
        ];
    }
}
