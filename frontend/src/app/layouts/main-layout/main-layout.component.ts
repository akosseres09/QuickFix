import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { ChildRoute, SidenavRoute } from '../../shared/constants/route/Routes';
import { NavitemComponent } from '../../common/sidenav/navitem/navitem.component';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { filter, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { OrganizationService } from '../../shared/services/organization/organization.service';
import { Organization } from '../../shared/model/Organization';

@Component({
    selector: 'app-main-layout',
    imports: [
        NavbarComponent,
        RouterModule,
        MatSidenavContainer,
        MatSidenav,
        MatSidenavContent,
        NavitemComponent,
        CommonModule,
    ],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
    private readonly themeService = inject(ThemeService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);
    private readonly organizationService = inject(OrganizationService);

    projectId = signal<string | null>(null);
    organizationId = input.required<string>();
    organization = signal<Organization | null>(null);

    isSidebarOpened = signal<boolean>(window.innerWidth > 767);
    sidenavRoutes = computed(() => {
        return this.getSidenavRoutes();
    });
    bottomSidenavRoutes = signal<SidenavRoute[]>([]);
    imageSource = signal<string>(this.themeService.logos[this.themeService.getTheme()]);
    sidebarMode = signal<'over' | 'push' | 'side'>(window.innerWidth < 768 ? 'over' : 'side');

    constructor() {
        fromEvent(window, 'resize')
            .pipe(takeUntilDestroyed())
            .subscribe(() => {
                this.sidebarMode.set(window.innerWidth < 768 ? 'over' : 'side');
                this.isSidebarOpened.set(window.innerWidth > 767);
            });

        this.router.events
            .pipe(
                takeUntilDestroyed(),
                filter((event) => event instanceof NavigationEnd)
            )
            .subscribe(() => {
                let route = this.router.routerState.root;
                while (route.firstChild) {
                    route = route.firstChild;
                }
                this.projectId.set(route.snapshot.params['projectId'] || null);
            });
    }

    getOrganization() {
        const id = this.organizationId();
        if (!id) {
            this.snackbarService.error('No organization selected!');
            this.router.navigate(['/organizations']);
            return;
        }

        this.organizationService.getOrganization(id).subscribe({
            next: (org) => {
                this.organization.set(org);
            },
            error: (error) => {
                console.error(error);
                this.snackbarService.error('Failed to load organization!');
                this.router.navigate(['/organizations']);
            },
        });
    }

    ngOnInit(): void {
        this.getOrganization();
        this.bottomSidenavRoutes.set(this.getBottomSidenavRoutes());
    }

    getSidenavRoutes(): SidenavRoute[] {
        const orgId = this.organizationId();
        const org = this.organization();
        const projId = this.projectId();

        if (!orgId || !org) {
            return [];
        }

        const basePath = `/${orgId}`;
        const projPath = `${basePath}/project/${projId}`;

        return [
            {
                name: org.name,
                type: 'button',
                path: basePath,
                url: org.logoUrl as string,
                icon: 'apartment',
                exact: false,
            },

            ...(projId
                ? ([
                      { name: projId, type: 'button', path: projPath, icon: 'bolt' },
                      {
                          name: 'Projects',
                          type: 'button',
                          path: `${basePath}/projects`,
                          icon: 'folder_open',
                      },
                      {
                          name: 'Issues',
                          type: 'menu',
                          icon: 'report_problem',
                          path: `${projPath}/issues`,
                          children: [
                              {
                                  name: 'Overview',
                                  path: `${projPath}/issues/overview`,
                                  icon: 'travel_explore',
                              },
                              { name: 'Issues', path: `${projPath}/issues`, icon: 'assignment' },
                              {
                                  name: 'Board',
                                  path: `${projPath}/issues/board`,
                                  icon: 'space_dashboard',
                              },
                              {
                                  name: 'New Issue',
                                  path: `${projPath}/issues/add`,
                                  icon: 'add_task',
                              },
                          ],
                      },
                  ] as SidenavRoute[])
                : []),

            {
                name: 'Manage',
                type: 'menu',
                icon: 'manage_accounts',
                path: `${basePath}/manage`,
                children: [
                    // Conditionally add project members to the manage children
                    ...(projId
                        ? [
                              {
                                  name: 'Project members',
                                  path: `${projPath}/members`,
                                  icon: 'group',
                              },
                              {
                                  name: 'Project activity',
                                  path: `${projPath}/activity`,
                                  icon: 'local_activity',
                              },
                          ]
                        : [
                              {
                                  name: 'Activity',
                                  path: `${basePath}/activity`,
                                  icon: 'local_activity',
                              },
                              {
                                  name: 'Organization members',
                                  path: `${basePath}/members`,
                                  icon: 'person',
                              },
                          ]),
                ],
            },
            {
                name: 'Worktime',
                type: 'button',
                path: `${basePath}/worktime`,
                icon: 'access_time',
            },
        ];
    }

    getBottomSidenavRoutes(): SidenavRoute[] {
        return [
            {
                name: 'Account',
                path: '/account',
                type: 'menu',
                icon: 'account_box',
                children: [
                    {
                        name: 'Settings',
                        path: '/settings',
                        icon: 'settings',
                    },
                    {
                        name: 'Logout',
                        onClick: () => {
                            this.logout();
                        },
                        icon: 'logout',
                    },
                ],
            },
        ];
    }

    logout() {
        this.authService.logout().subscribe({
            next: () => {
                this.router.navigate(['/auth/login']);
            },
            error: (error) => {
                console.error(error);
                this.snackbarService.open('Failed to log out!', ['snackbar-error']);
            },
        });
    }
}
