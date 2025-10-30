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
                title: 'QuickFix - Login',
            },
            {
                path: 'signup',
                loadComponent: () =>
                    import('./auth/signup/signup.component').then((c) => c.SignupComponent),
                title: 'QuickFix - Signup',
            },
            {
                path: 'reset-password',
                loadComponent: () =>
                    import('./auth/reset-password/reset-password.component').then(
                        (c) => c.ResetPasswordComponent
                    ),
                title: 'QuickFix - Reset Password',
            },
            {
                path: 'verify',
                loadComponent: () =>
                    import('./auth/verify/verify.component').then((c) => c.VerifyComponent),
                title: 'QuickFix - Verify Account',
            },
            {
                path: 'resend-verification',
                loadComponent: () =>
                    import('./auth/resend-verification/resend-verification.component').then(
                        (c) => c.ResendVerificationComponent
                    ),
                title: 'QuickFix - Resend Verification',
            },
            {
                path: 'not-found',
                loadComponent: () =>
                    import('./auth/not-found/not-found.component').then((c) => c.NotFoundComponent),
                title: 'QuickFix - Not Found',
            },
            {
                path: '**',
                redirectTo: 'not-found',
            },
        ],
    },
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./main/home/home.component').then((c) => c.HomeComponent),
    },
    {
        path: '',
        loadComponent: () =>
            import('./layouts/main-layout/main-layout.component').then(
                (c) => c.MainLayoutComponent
            ),
        children: [
            {
                path: 'issues',
                loadComponent: () =>
                    import('./layouts/tabs-layout/tabs-layout.component').then(
                        (c) => c.TabsLayoutComponent
                    ),
                data: {
                    tabs: [
                        {
                            label: 'Overview',
                            route: '/issues/overview',
                        },
                        {
                            label: 'Issues',
                            route: '/issues',
                        },
                        {
                            label: 'Board',
                            route: '/issues/board',
                        },
                        {
                            label: 'New Issue',
                            route: '/issues/new',
                        },
                    ],
                },
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        loadComponent: () =>
                            import('./main/issues/issues.component').then((c) => c.IssuesComponent),
                        title: 'QuickFix - Issues',
                    },
                    {
                        path: 'board',
                        loadComponent: () =>
                            import('./main/issues/board/board.component').then(
                                (c) => c.BoardComponent
                            ),
                        title: 'QuickFix - Issue Board',
                    },
                    {
                        path: 'new',
                        loadComponent: () =>
                            import('./main/issues/new/new.component').then((c) => c.NewComponent),
                        title: 'QuickFix - New Issue',
                    },
                    {
                        path: 'overview',
                        loadComponent: () =>
                            import('./main/issues/overview/overview.component').then(
                                (c) => c.OverviewComponent
                            ),
                        title: 'QuickFix - Overview',
                    },
                ],
            },
        ],
    },
];
