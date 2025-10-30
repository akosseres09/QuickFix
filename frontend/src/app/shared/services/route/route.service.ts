import { Injectable } from '@angular/core';
import { AppRoute } from '../../constants/Routes';
import { User } from '../../model/User';

@Injectable({
    providedIn: 'root',
})
export class RouteService {
    constructor() {}

    getAppRoutes(user: User | null): Array<AppRoute> {
        return [
            {
                path: '/auth/login',
                name: 'Login',
                type: 'button',
                show: user === null,
            },
            {
                path: '/auth/signup',
                name: 'Sign Up',
                type: 'button',
                show: user === null,
            },
            {
                path: '',
                name: 'Home',
                type: 'button',
                show: user === null,
            },
            {
                type: 'menu',
                show: user !== null,
                name: 'Account',
                icon: 'account_circle',
                children: [
                    {
                        name: 'Account',
                        path: '/account',
                        icon: 'person',
                    },
                    {
                        name: 'Settings',
                        path: '/settings',
                        icon: 'settings',
                    },
                    {
                        path: '/auth/logout',
                        name: 'Logout',
                        icon: 'logout',
                    },
                ],
            },
        ];
    }

    getSidenavRoutes(): Array<AppRoute> {
        return [
            {
                name: 'Issues',
                type: 'menu',
                icon: 'report_problem',
                path: '/issues',
                children: [
                    {
                        name: 'Overview',
                        path: '/issues/overview',
                        icon: 'travel_explore',
                    },
                    {
                        name: 'Issues',
                        path: '/issues',
                        icon: 'assignment',
                    },
                    {
                        name: 'Board',
                        path: '/issues/board',
                        icon: 'space_dashboard',
                    },
                    {
                        name: 'New Issue',
                        path: '/issues/new',
                        icon: 'add_task',
                    },
                ],
            },
            {
                name: 'Projects',
                type: 'menu',
                icon: 'folder',
                path: '/projects',
                children: [
                    {
                        path: '/projects/overview',
                        name: 'Overview',
                        icon: 'travel_explore',
                    },
                    {
                        path: '/projects/overview',
                        name: 'Projects',
                        icon: 'folder',
                    },
                    {
                        path: '/projects/new',
                        name: 'New Project',
                        icon: 'create_new_folder',
                    },
                ],
            },
            {
                name: 'Worktime',
                type: 'menu',
                icon: 'access_time',
                path: '/worktime',
                children: [
                    {
                        name: 'Issues',
                        icon: 'report_problem',
                        path: '/worktime/issues',
                    },
                    {
                        name: 'Projects',
                        icon: 'folder',
                        path: '/worktime/projects',
                    },
                    {
                        name: 'Statistics',
                        icon: 'bar_chart',
                        path: '/worktime',
                    },
                ],
            },
        ];
    }

    getBottomSidenavRoutes(): Array<AppRoute> {
        return [
            {
                type: 'button',
                name: 'Account',
                icon: 'person',
                path: '/account',
            },
            {
                type: 'button',
                name: 'Settings',
                icon: 'settings',
                path: '/settings',
            },
        ];
    }
}
