import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { SidenavRoute } from '../../shared/constants/route/Routes';
import { NavitemComponent } from '../../common/sidenav/navitem/navitem.component';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth/auth.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

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

    projectId = input.required<string>();

    isSidebarOpened = signal<boolean>(window.innerWidth > 767);
    sidenavRoutes = signal<SidenavRoute[]>([]);
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
    }

    ngOnInit(): void {
        this.sidenavRoutes.set(this.getSidenavRoutes());
        this.bottomSidenavRoutes.set(this.getBottomSidenavRoutes());
    }

    getSidenavRoutes(): SidenavRoute[] {
        return [
            {
                name: this.projectId(),
                type: 'button',
                path: `/project/${this.projectId()}`,
                icon: 'bolt',
            },
            {
                name: 'Projects',
                type: 'button',
                path: '/projects',
                icon: 'folder_open',
            },
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
                        path: `/project/${this.projectId()}/issues/add`,
                        icon: 'add_task',
                    },
                ],
            },
            {
                name: 'Manage',
                type: 'menu',
                icon: 'manage_accounts',
                path: `/project/${this.projectId()}/manage`,
                children: [
                    {
                        name: 'Members',
                        path: `/project/${this.projectId()}/members`,
                        icon: 'person',
                    },
                    {
                        name: 'Activity',
                        path: `/project/${this.projectId()}/activity`,
                        icon: 'local_activity',
                    },
                    {
                        name: 'Labels',
                        icon: 'label',
                        path: `/project/${this.projectId()}/labels`,
                    },
                ],
            },
            {
                name: 'Worktime',
                path: '/worktime',
                type: 'button',
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
