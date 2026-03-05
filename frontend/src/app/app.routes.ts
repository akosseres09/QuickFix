import { Routes } from '@angular/router';
import { authenticatedGuard } from './shared/guards/authenticated/authenticated.guard';
import { unauthenticatedGuard } from './shared/guards/unauthenticated/unauthenticated.guard';

export const routes: Routes = [
    {
        path: 'auth',
        loadComponent: () =>
            import('./layouts/base-layout/base-layout.component').then(
                (c) => c.BaseLayoutComponent
            ),
        canActivate: [unauthenticatedGuard], // Applied once at the parent level
        children: [
            { path: '', redirectTo: 'login', pathMatch: 'full' },
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
        path: '',
        loadComponent: () =>
            import('./layouts/base-layout/base-layout.component').then(
                (c) => c.BaseLayoutComponent
            ),
        canActivate: [authenticatedGuard],
        children: [
            {
                path: 'organizations',
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        loadComponent: () =>
                            import('./main/organizations/organizations.component').then(
                                (c) => c.OrganizationsComponent
                            ),
                        title: 'QuickFix - Organizations',
                    },
                    {
                        path: 'new',
                        loadComponent: () =>
                            import(
                                './main/organizations/create-organization/create-organization.component'
                            ).then((c) => c.CreateOrganizationComponent),
                        title: 'QuickFix - New Organization',
                    },
                    {
                        path: ':organizationId/edit',
                        loadComponent: () =>
                            import(
                                './main/organizations/edit-organization/edit-organization.component'
                            ).then((c) => c.EditOrganizationComponent),
                        title: 'QuickFix - Edit Organization',
                    },
                ],
            },
            {
                path: 'account',
                loadComponent: () =>
                    import('./main/account/account.component').then((c) => c.AccountComponent),
                title: 'QuickFix - Account',
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./main/settings/settings.component').then((c) => c.SettingsComponent),
                title: 'QuickFix - Settings',
            },
            {
                path: 'worktime',
                loadComponent: () =>
                    import('./main/worktime/worktime.component').then((c) => c.WorktimeComponent),
                title: 'QuickFix - Worktime',
            },
        ],
    },

    {
        path: ':organizationId',
        loadComponent: () =>
            import('./layouts/main-layout/main-layout.component').then(
                (c) => c.MainLayoutComponent
            ),
        canActivate: [authenticatedGuard], // Applied once at the parent level
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'projects' },
            {
                path: 'projects',
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        loadComponent: () =>
                            import('./main/projects/projects.component').then(
                                (c) => c.ProjectsComponent
                            ),
                        title: 'QuickFix - Projects',
                    },
                    {
                        path: 'new',
                        loadComponent: () =>
                            import('./main/projects/new-project/new-project.component').then(
                                (c) => c.NewProjectComponent
                            ),
                        title: 'QuickFix - New Project',
                    },
                ],
            },
            {
                path: 'worktime',
                loadComponent: () =>
                    import('./main/worktime/worktime.component').then((c) => c.WorktimeComponent),
                title: 'QuickFix - Worktime',
            },
            {
                path: 'members',
                loadComponent: () =>
                    import(
                        './main/organizations/manage/organization-members/organization-members.component'
                    ).then((c) => c.OrganizationMembersComponent),
                title: 'QuickFix - Members',
            },
            {
                path: 'activity',
                loadComponent: () =>
                    import(
                        './main/organizations/manage/organization-activity/organization-activity.component'
                    ).then((c) => c.OrganizationActivityComponent),
                title: 'QuickFix - Activity',
            },
            {
                path: 'project/:projectId',
                children: [
                    { path: '', pathMatch: 'full', redirectTo: 'issues' },
                    {
                        path: 'edit',
                        loadComponent: () =>
                            import('./main/projects/edit-project/edit-project.component').then(
                                (c) => c.EditProjectComponent
                            ),
                        title: 'QuickFix - Edit Project',
                    },
                    {
                        path: 'members',
                        loadComponent: () =>
                            import('./main/manage/members/members.component').then(
                                (c) => c.MembersComponent
                            ),
                        title: 'QuickFix - Members',
                    },
                    {
                        path: 'activity',
                        loadComponent: () =>
                            import('./main/manage/activity/activity.component').then(
                                (c) => c.ActivityComponent
                            ),
                        title: 'QuickFix - Activity',
                    },
                    {
                        path: 'labels',
                        loadComponent: () =>
                            import('./main/manage/labels/labels.component').then(
                                (c) => c.LabelsComponent
                            ),
                        title: 'QuickFix - Labels',
                    },
                    {
                        path: 'issues',
                        loadComponent: () =>
                            import('./layouts/tabs-layout/tabs-layout.component').then(
                                (c) => c.TabsLayoutComponent
                            ),
                        data: {
                            tabs: [
                                { label: 'Overview', route: 'overview' },
                                { label: 'Issues', route: '.' },
                                { label: 'Board', route: 'board' },
                                { label: 'New Issue', route: 'add' },
                            ],
                        },
                        children: [
                            {
                                path: '',
                                pathMatch: 'full',
                                loadComponent: () =>
                                    import('./main/issues/issues.component').then(
                                        (c) => c.IssuesComponent
                                    ),
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
                                path: 'add',
                                loadComponent: () =>
                                    import('./main/issues/new-issue/new-issue.component').then(
                                        (c) => c.NewIssueComponent
                                    ),
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
                    {
                        path: 'issue/:issueId',
                        children: [
                            { path: '', pathMatch: 'full', redirectTo: 'view' },
                            {
                                path: 'view',
                                loadComponent: () =>
                                    import('./main/issues/view-issue/view-issue.component').then(
                                        (c) => c.ViewIssueComponent
                                    ),
                                title: 'QuickFix - View Issue',
                            },
                            {
                                path: 'edit',
                                loadComponent: () =>
                                    import('./main/issues/edit-issue/edit-issue.component').then(
                                        (c) => c.EditIssueComponent
                                    ),
                                title: 'QuickFix - Edit Issue',
                            },
                        ],
                    },
                ],
            },
        ],
    },

    // ---------------------------------------------------------
    // GLOBAL WILDCARD (404)
    // ---------------------------------------------------------
    {
        path: '**',
        loadComponent: () =>
            import('./layouts/base-layout/base-layout.component').then(
                (c) => c.BaseLayoutComponent
            ),
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./auth/not-found/not-found.component').then((c) => c.NotFoundComponent),
                title: 'QuickFix - Not Found',
            },
        ],
    },
];
