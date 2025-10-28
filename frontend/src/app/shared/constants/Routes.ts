import { User } from '../model/User';

export type AppRoute =
    | {
          type: 'menu';
          name: string;
          active: boolean;
          icon?: string;
          children: Array<AppRoute>;
          path?: never;
      }
    | {
          type: 'button';
          name: string;
          active: boolean;
          path: string;
          icon?: string;
          children?: never;
      };

export function getAppRoutes(user: User | null): Array<AppRoute> {
    return [
        {
            path: '/auth/login',
            name: 'Login',
            active: user === null,
            type: 'button',
        },
        {
            path: '/auth/signup',
            name: 'Sign Up',
            active: user === null,
            type: 'button',
        },
        {
            path: '',
            name: 'Home',
            active: user === null,
            type: 'button',
        },
        {
            name: 'Profile',
            active: user !== null,
            type: 'menu',
            icon: 'account_circle',
            children: [
                {
                    type: 'button',
                    path: '/profile',
                    name: 'Profile',
                    icon: 'person',
                    active: user !== null,
                },
                {
                    type: 'button',
                    path: '/profile/settings',
                    name: 'Settings',
                    icon: 'settings',
                    active: user !== null,
                },
                {
                    type: 'button',
                    path: '/auth/logout',
                    name: 'Logout',
                    icon: 'logout',
                    active: user !== null,
                },
            ],
        },
    ];
}
