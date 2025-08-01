import { Routes } from '@angular/router';
import { AuthComponent } from './layouts/auth/auth.component';

export const routes: Routes = [
    {
        path: 'auth',
        component: AuthComponent,
        children: [
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full',
            },
            {
                path: 'login',
                loadComponent: () =>
                    import('./auth/login/login.component').then(
                        (c) => c.LoginComponent
                    ),
            },
            {
                path: 'signup',
                loadComponent: () =>
                    import('./auth/signup/signup.component').then(
                        (c) => c.SignupComponent
                    ),
            },
            {
                path: 'not-found',
                loadComponent: () =>
                    import('./auth/not-found/not-found.component').then(
                        (c) => c.NotFoundComponent
                    ),
            },
            {
                path: 'reset-password',
                loadComponent: () =>
                    import(
                        './auth/reset-password/reset-password.component'
                    ).then((c) => c.ResetPasswordComponent),
            },
            {
                path: '**',
                redirectTo: 'not-found',
            },
        ],
    },
];
