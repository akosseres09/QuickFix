import { Routes } from '@angular/router';
import { authenticatedGuard } from './shared/guards/authenticated/authenticated.guard';
import { unauthenticatedGuard } from './shared/guards/unauthenticated/unauthenticated.guard';
import { invitationGuard } from './shared/guards/invitation/invitation.guard';
import { permissionGuard } from './shared/guards/permission/permission.guard';
import {
    IssuePermissions,
    OrganizationPermissions,
    ProjectPermissions,
    WorktimePermissions,
} from './shared/constants/user/Permissions';
import { permissionResolver } from './shared/resolvers/permission/permission.resolver';

export const routes: Routes = [
    {
        path: 'auth',
        loadComponent: () =>
            import('./layouts/base-layout/base-layout.component').then(
                (c) => c.BaseLayoutComponent
            ),
        canActivate: [unauthenticatedGuard],
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
                path: 'request-password-reset',
                loadComponent: () =>
                    import(
                        './auth/request-password-reset-email/request-password-reset-email.component'
                    ).then((c) => c.RequestPasswordResetEmailComponent),
                title: 'QuickFix - Request Password Reset',
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
            import('./layouts/main-layout/main-layout.component').then(
                (c) => c.MainLayoutComponent
            ),
        canActivate: [authenticatedGuard],
        resolve: { permissions: permissionResolver },
        runGuardsAndResolvers: 'paramsChange',
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
                        canActivate: [permissionGuard],
                        data: { permission: OrganizationPermissions.CREATE },
                    },
                    {
                        path: ':organizationId/edit',
                        loadComponent: () =>
                            import(
                                './main/organizations/edit-organization/edit-organization.component'
                            ).then((c) => c.EditOrganizationComponent),
                        title: 'QuickFix - Edit Organization',
                        canActivate: [permissionGuard],
                        data: { permission: OrganizationPermissions.UPDATE },
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
                path: 'invitations',
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        loadComponent: () =>
                            import(
                                './main/organization-invitation/organization-invitation.component'
                            ).then((c) => c.OrganizationInvitationComponent),
                        title: 'QuickFix - Invitations',
                    },
                ],
            },
        ],
    },
    {
        path: 'invitation/:invitationId',
        loadComponent: () =>
            import('./layouts/main-layout/main-layout.component').then(
                (c) => c.MainLayoutComponent
            ),
        canActivate: [invitationGuard, authenticatedGuard],
        resolve: { permissions: permissionResolver },
        runGuardsAndResolvers: 'paramsChange',
        children: [
            {
                path: '',
                loadComponent: () =>
                    import(
                        './main/organization-invitation/organization-invitation-item/organization-invitation-item.component'
                    ).then((c) => c.OrganizationInvitationItemComponent),
                title: 'QuickFix - Invitation',
            },
        ],
    },
    {
        path: 'org/:organizationId',
        loadComponent: () =>
            import('./layouts/main-layout/main-layout.component').then(
                (c) => c.MainLayoutComponent
            ),
        canActivate: [authenticatedGuard],
        resolve: { permissions: permissionResolver },
        runGuardsAndResolvers: 'paramsChange',
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
                        canActivate: [permissionGuard],
                        data: { permission: OrganizationPermissions.VIEW },
                    },
                    {
                        path: 'new',
                        loadComponent: () =>
                            import('./main/projects/new-project/new-project.component').then(
                                (c) => c.NewProjectComponent
                            ),
                        title: 'QuickFix - New Project',
                        canActivate: [permissionGuard],
                        data: { permission: ProjectPermissions.CREATE },
                    },
                ],
            },
            {
                path: 'worktime',
                loadComponent: () =>
                    import('./layouts/tabs-layout/tabs-layout.component').then(
                        (c) => c.TabsLayoutComponent
                    ),
                data: {
                    tabs: [
                        { label: 'Worktime', route: 'view', permission: WorktimePermissions.VIEW },
                        { label: 'Stats', route: 'stats', permission: WorktimePermissions.VIEW },
                    ],
                },
                children: [
                    { path: '', pathMatch: 'full', redirectTo: 'view' },
                    {
                        path: 'view',
                        loadComponent: () =>
                            import('./main/worktime/worktime.component').then(
                                (c) => c.WorktimeComponent
                            ),
                        canActivate: [permissionGuard],
                        data: { permission: WorktimePermissions.VIEW },
                        title: 'QuickFix - Worktime',
                    },
                    {
                        path: 'stats',
                        loadComponent: () =>
                            import('./main/worktime/worktime-stats/worktime-stats.component').then(
                                (c) => c.WorktimeStatsComponent
                            ),
                        canActivate: [permissionGuard],
                        data: { permission: WorktimePermissions.VIEW },
                        title: 'QuickFix - Worktime Statistics',
                    },
                ],
            },
            {
                path: 'members',
                loadComponent: () =>
                    import(
                        './main/organizations/manage/organization-members/organization-members.component'
                    ).then((c) => c.OrganizationMembersComponent),
                title: 'QuickFix - Members',
                canActivate: [permissionGuard],
                data: { permission: OrganizationPermissions.MEMBERS_VIEW },
            },
            {
                path: 'member/:memberId',
                loadComponent: () =>
                    import(
                        './main/organizations/manage/organization-member-item/organization-member-item.component'
                    ).then((c) => c.OrganizationMemberItemComponent),
                title: 'QuickFix - Member Details',
                canActivate: [permissionGuard],
                data: { permission: OrganizationPermissions.MEMBERS_VIEW },
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
                        canActivate: [permissionGuard],
                        data: { permission: ProjectPermissions.UPDATE },
                    },
                    {
                        path: 'members',
                        loadComponent: () =>
                            import('./main/manage/members/members.component').then(
                                (c) => c.MembersComponent
                            ),
                        title: 'QuickFix - Members',
                        canActivate: [permissionGuard],
                        data: { permission: ProjectPermissions.MEMBERS_VIEW },
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
                        canActivate: [permissionGuard],
                        data: {
                            tabs: [
                                {
                                    label: 'Overview',
                                    route: 'overview',
                                    permission: IssuePermissions.VIEW,
                                },
                                { label: 'Issues', route: '.', permission: IssuePermissions.VIEW },
                                {
                                    label: 'Board',
                                    route: 'board',
                                    permission: IssuePermissions.VIEW,
                                },
                                {
                                    label: 'New Issue',
                                    route: 'add',
                                    permission: IssuePermissions.CREATE,
                                },
                            ],
                            permission: IssuePermissions.VIEW,
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
                                canActivate: [permissionGuard],
                                data: { permission: IssuePermissions.VIEW },
                            },
                            {
                                path: 'board',
                                loadComponent: () =>
                                    import('./main/issues/board/board.component').then(
                                        (c) => c.BoardComponent
                                    ),
                                title: 'QuickFix - Issue Board',
                                canActivate: [permissionGuard],
                                data: { permission: IssuePermissions.VIEW },
                            },
                            {
                                path: 'add',
                                loadComponent: () =>
                                    import('./main/issues/new-issue/new-issue.component').then(
                                        (c) => c.NewIssueComponent
                                    ),
                                title: 'QuickFix - New Issue',
                                canActivate: [permissionGuard],
                                data: { permission: IssuePermissions.CREATE },
                            },
                            {
                                path: 'overview',
                                loadComponent: () =>
                                    import('./main/issues/overview/overview.component').then(
                                        (c) => c.OverviewComponent
                                    ),
                                title: 'QuickFix - Overview',
                                canActivate: [permissionGuard],
                                data: { permission: ProjectPermissions.VIEW },
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
                                canActivate: [permissionGuard],
                                data: { permission: IssuePermissions.VIEW },
                            },
                            {
                                path: 'edit',
                                loadComponent: () =>
                                    import('./main/issues/edit-issue/edit-issue.component').then(
                                        (c) => c.EditIssueComponent
                                    ),
                                title: 'QuickFix - Edit Issue',
                                canActivate: [permissionGuard],
                                data: { permission: IssuePermissions.UPDATE },
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        path: '**',
        loadComponent: () =>
            import('./layouts/main-layout/main-layout.component').then(
                (c) => c.MainLayoutComponent
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
