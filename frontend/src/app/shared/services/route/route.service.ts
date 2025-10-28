import { Injectable } from '@angular/core';
import { AppRoute } from '../../constants/Routes';

@Injectable({
    providedIn: 'root',
})
export class RouteService {
    constructor() {}

    getBaseAppRoutes(): Array<AppRoute> {
        return [
            {
                path: '/auth/login',
                name: 'Login',
                type: 'button',
            },
            {
                path: '/auth/signup',
                name: 'Sign Up',
                type: 'button',
            },
            {
                path: '',
                name: 'Home',
                type: 'button',
            },
        ];
    }

    getMainAppRoutes(): Array<AppRoute> {
        return [];
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
