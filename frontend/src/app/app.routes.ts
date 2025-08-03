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
                    import('./auth/login/login.component').then((c) => c.LoginComponent),
                title: 'Ticketing - Login',
            },
            {
                path: 'signup',
                loadComponent: () =>
                    import('./auth/signup/signup.component').then((c) => c.SignupComponent),
                title: 'Ticketing - Signup',
            },
            {
                path: 'reset-password',
                loadComponent: () =>
                    import('./auth/reset-password/reset-password.component').then(
                        (c) => c.ResetPasswordComponent
                    ),
                title: 'Ticketing - Reset Password',
            },
            {
                path: 'verify',
                loadComponent: () =>
                    import('./auth/verify/verify.component').then((c) => c.VerifyComponent),
                title: 'Ticketing - Verify Account',
            },
            {
                path: 'not-found',
                loadComponent: () =>
                    import('./auth/not-found/not-found.component').then((c) => c.NotFoundComponent),
                title: 'Ticketing - Not Found',
            },
            {
                path: '**',
                redirectTo: 'not-found',
            },
        ],
    },
];
