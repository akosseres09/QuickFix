import { Routes } from '@angular/router';
import { WorktimeComponent } from './main/worktime/worktime.component';
import { authenticatedGuard } from './shared/guards/authenticated/authenticated.guard';
import { unauthenticatedGuard } from './shared/guards/unauthenticated/unauthenticated.guard';

export const routes: Routes = [
    {
        path: 'auth',
        loadComponent: () =>
            import('./layouts/base-layout/base-layout.component').then(
                (c) => c.BaseLayoutComponent
            ),
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
                canActivate: [unauthenticatedGuard],
            },
            {
                path: 'signup',
                loadComponent: () =>
                    import('./auth/signup/signup.component').then((c) => c.SignupComponent),
                title: 'QuickFix - Signup',
                canActivate: [unauthenticatedGuard],
            },
            {
                path: 'reset-password',
                loadComponent: () =>
                    import('./auth/reset-password/reset-password.component').then(
                        (c) => c.ResetPasswordComponent
                    ),
                title: 'QuickFix - Reset Password',
                canActivate: [unauthenticatedGuard],
            },
            {
                path: 'verify',
                loadComponent: () =>
                    import('./auth/verify/verify.component').then((c) => c.VerifyComponent),
                title: 'QuickFix - Verify Account',
                canActivate: [unauthenticatedGuard],
            },
            {
                path: 'resend-verification',
                loadComponent: () =>
                    import('./auth/resend-verification/resend-verification.component').then(
                        (c) => c.ResendVerificationComponent
                    ),
                title: 'QuickFix - Resend Verification',
                canActivate: [unauthenticatedGuard],
            },
            {
                path: 'not-found',
                loadComponent: () =>
                    import('./auth/not-found/not-found.component').then((c) => c.NotFoundComponent),
                title: 'QuickFix - Not Found',
                canActivate: [unauthenticatedGuard],
            },
            {
                path: '**',
                redirectTo: 'not-found',
            },
        ],
    },
    {
        path: '',
        loadComponent: () =>
            import('./layouts/base-layout/base-layout.component').then(
                (c) => c.BaseLayoutComponent
            ),
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                    import('./main/home/home.component').then((c) => c.HomeComponent),
                title: 'QuickFix - Home',
            },
        ],
    },
    {
        path: 'project/:projectId/edit',
        loadComponent: () =>
            import('./layouts/base-layout/base-layout.component').then(
                (c) => c.BaseLayoutComponent
            ),
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./main/projects/edit-project/edit-project.component').then(
                        (c) => c.EditProjectComponent
                    ),
                title: 'QuickFix - Edit Project',
                canActivate: [authenticatedGuard],
            },
        ],
    },
    {
        path: 'project/:projectId',
        loadComponent: () =>
            import('./layouts/main-layout/main-layout.component').then(
                (c) => c.MainLayoutComponent
            ),
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'issues',
            },
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
                            route: 'overview',
                        },
                        {
                            label: 'Issues',
                            route: '.',
                        },
                        {
                            label: 'Board',
                            route: 'board',
                        },
                        {
                            label: 'New Issue',
                            route: 'add',
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
                        canActivate: [authenticatedGuard],
                    },
                    {
                        path: 'board',
                        loadComponent: () =>
                            import('./main/issues/board/board.component').then(
                                (c) => c.BoardComponent
                            ),
                        title: 'QuickFix - Issue Board',
                        canActivate: [authenticatedGuard],
                    },
                    {
                        path: 'add',
                        loadComponent: () =>
                            import('./main/issues/new-issue/new-issue.component').then(
                                (c) => c.NewIssueComponent
                            ),
                        title: 'QuickFix - New Issue',
                        canActivate: [authenticatedGuard],
                    },
                    {
                        path: 'overview',
                        loadComponent: () =>
                            import('./main/issues/overview/overview.component').then(
                                (c) => c.OverviewComponent
                            ),
                        title: 'QuickFix - Overview',
                        canActivate: [authenticatedGuard],
                    },
                ],
            },
            {
                path: 'issue/:issueId',
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'view',
                    },
                    {
                        path: 'view',
                        loadComponent: () =>
                            import('./main/issues/view-issue/view-issue.component').then(
                                (c) => c.ViewIssueComponent
                            ),
                        title: 'QuickFix - View Issue',
                        canActivate: [authenticatedGuard],
                    },
                    {
                        path: 'edit',
                        loadComponent: () =>
                            import('./main/issues/edit-issue/edit-issue.component').then(
                                (c) => c.EditIssueComponent
                            ),
                        title: 'QuickFix - Edit Issue',
                        canActivate: [authenticatedGuard],
                    },
                ],
            },
            {
                path: 'members',
                loadComponent: () =>
                    import('./main/manage/members/members.component').then(
                        (c) => c.MembersComponent
                    ),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - Members',
            },
            {
                path: 'activity',
                loadComponent: () =>
                    import('./main/manage/activity/activity.component').then(
                        (c) => c.ActivityComponent
                    ),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - Activity',
            },
            {
                path: 'labels',
                loadComponent: () =>
                    import('./main/manage/labels/labels.component').then((c) => c.LabelsComponent),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - Labels',
            },
        ],
    },
    {
        path: '',
        loadComponent: () =>
            import('./layouts/base-layout/base-layout.component').then(
                (c) => c.BaseLayoutComponent
            ),
        children: [
            {
                path: 'projects',
                loadComponent: () =>
                    import('./main/projects/projects.component').then((c) => c.ProjectsComponent),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - Projects',
            },
            {
                path: 'projects/new',
                loadComponent: () =>
                    import('./main/projects/new-project/new-project.component').then(
                        (c) => c.NewProjectComponent
                    ),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - New Project',
            },
            {
                path: 'worktime',
                loadComponent: () =>
                    import('./main/worktime/worktime.component').then((c) => WorktimeComponent),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - Worktime',
            },
            {
                path: 'account',
                loadComponent: () =>
                    import('./main/account/account.component').then((c) => c.AccountComponent),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - Account',
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./main/settings/settings.component').then((c) => c.SettingsComponent),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - Settings',
            },
            {
                path: '**',
                loadComponent: () =>
                    import('./auth/not-found/not-found.component').then((c) => c.NotFoundComponent),
                canActivate: [authenticatedGuard],
                title: 'QuickFix - Not Found',
            },
        ],
    },
];
