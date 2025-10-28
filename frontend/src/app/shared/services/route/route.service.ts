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
                active: user === null,
            },
            {
                path: '/auth/signup',
                name: 'Sign Up',
                type: 'button',
                active: user === null,
            },
            {
                path: '',
                name: 'Home',
                type: 'button',
                active: user === null,
            },
            {
                type: 'menu',
                active: user !== null,
                icon: 'account_circle',
                children: [
                    {
                        type: 'button',
                        name: 'Account',
                        path: '/profile',
                        icon: 'person',
                    },
                    {
                        type: 'button',
                        name: 'Settings',
                        path: '/settings',
                        icon: 'settings',
                    },
                    {
                        type: 'button',
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
                name: 'Dashboard',
                type: 'menu',
                children: [
                    {
                        type: 'button',
                        path: '/dashboard/overview',
                        name: 'Overview',
                    },
                ],
            },
        ];
    }
}
