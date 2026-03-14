import { inject, Injectable } from '@angular/core';
import { DateService } from '../date/date.service';
import {
    Issue,
    PRIORITY_COLOR_MAP as issue_priority_color_map,
    PRIORITY_MAP as issue_priority_map,
    STATUS_COLOR_MAP as issue_status_color_map,
    STATUS_MAP as issue_status_map,
    TYPE_COLOR_MAP as issue_type_color_map,
    TYPE_MAP as issue_type_map,
} from '../../model/Issue';
import {
    PRIORITY_COLOR_MAP as project_priority_color_map,
    PRIORITY_MAP as project_priority_map,
    Project,
    STATUS_COLOR_MAP as project_status_color_map,
    STATUS_MAP as project_status_map,
} from '../../model/Project';
import { DisplayedColumn } from '../../constants/table/DisplayedColumn';
import { Label } from '../../model/Label';
import { Organization } from '../../model/Organization';
import { Worktime } from '../../model/Worktime';
import {
    OrganizationInvitation,
    ORGANIZATION_INVITATION_STATUS_COLOR_MAP,
    ORGANIZATION_INVITATION_STATUS_MAP,
} from '../../model/OrganizationInvitation';
import { ORGANIZATION_MEMBER_ROLE_MAP } from '../../model/OrganizationMember';

@Injectable({
    providedIn: 'root',
})
export class DisplayedColumnService {
    private readonly dateService = inject(DateService);

    getIssueDisplayColumns(): DisplayedColumn<Issue>[] {
        return [
            {
                id: 'title',
                label: 'Title',
                sortable: false,
                value: (e: Issue) => e.title,
                routerLink: (e: Issue) => ['../issue', e.id],
            },
            {
                id: 'author',
                label: 'Author',
                sortable: false,
                value: (e: Issue) => e.creator?.fullName ?? 'Unknown',
                routerLink: (e: Issue) => {
                    if (!e.creator) return null;
                    return ['../member/', e.creator.username];
                },
                photoOnly: (e: Issue) => !!e.creator,
                photoUrl: (e: Issue) => e.creator?.profilePictureUrl ?? null,
            },
            {
                id: 'assignee',
                label: 'Assignee',
                sortable: false,
                value: (e: Issue) => e.assignee?.fullName ?? 'Unassigned',
                routerLink: (e: Issue) => {
                    if (!e.assignee?.username) return null;
                    return ['../member/', e.assignee.username];
                },
                photoOnly: (e: Issue) => !!e.assignee,
                photoUrl: (e: Issue) => e.assignee?.profilePictureUrl || null,
            },
            {
                id: 'status',
                label: 'Status',
                sortable: true,
                badge: (e: Issue) => issue_status_color_map[e.status],
                value: (e: Issue) => issue_status_map[e.status],
            },
            {
                id: 'priority',
                label: 'Priority',
                sortable: true,
                badge: (e: Issue) => issue_priority_color_map[e.priority],
                value: (e: Issue) => issue_priority_map[e.priority],
            },
            {
                id: 'type',
                label: 'Type',
                sortable: true,
                badge: (e: Issue) => issue_type_color_map[e.type],
                value: (e: Issue) => issue_type_map[e.type],
            },
            {
                id: 'createdAt',
                label: 'Created At',
                sortable: true,
                value: (e: Issue) => {
                    const date = this.dateService.parseTimestamp(e.createdAt);
                    return this.dateService.toLocaleISOString(date).split('T')[0];
                },
            },
        ];
    }

    getProjectColumns(): DisplayedColumn<Project>[] {
        return [
            {
                id: 'name',
                label: 'Name',
                sortable: true,
                value: (e: Project) => e.name,
                routerLink: (e: Project) => ['../', 'project', e.key],
            },
            {
                id: 'owner',
                label: 'Owner',
                sortable: false,
                value: (e: Project) => e.owner?.fullName ?? 'Unknown',
                routerLink: (e: Project) =>
                    e.owner?.username ? ['../member/', e.owner.username] : [],
                photoOnly: (e: Project) => !!e.owner,
                photoUrl: (e: Project) => e.owner?.profilePictureUrl ?? '',
            },
            {
                id: 'status',
                label: 'Status',
                sortable: true,
                badge: (e: Project) => project_status_color_map[e.status],
                value: (e: Project) => project_status_map[e.status],
            },
            {
                id: 'priority',
                label: 'Priority',
                sortable: true,
                badge: (e: Project) => project_priority_color_map[e.priority],
                value: (e: Project) => project_priority_map[e.priority],
            },
            {
                id: 'createdAt',
                label: 'Created At',
                sortable: true,
                value: (e: Project) => {
                    const date = this.dateService.parseTimestamp(e.createdAt);
                    return this.dateService.toLocaleISOString(date).split('T')[0];
                },
            },
        ];
    }

    getLabelColumns(): DisplayedColumn<Label>[] {
        return [
            {
                id: 'name',
                label: 'Name',
                sortable: true,
                badge: (e: Label) => e.color,
                value: (e: Label) => e.name,
            },
            {
                id: 'description',
                label: 'Description',
                sortable: false,
                value: (e: Label) => e.description,
            },
        ];
    }

    getOrganizationColumns(): DisplayedColumn<Organization>[] {
        return [
            {
                id: 'orgPhoto',
                label: '',
                value: (e: Organization) => e.name,
                sortable: false,
                photoOnly: () => true,
                photoUrl: (e: Organization) => e.logoUrl,
                routerLink: (e: Organization) => ['/org', e.slug],
            },
            {
                id: 'slug',
                label: 'Slug',
                sortable: true,
                value: (e: Organization) => e.slug,
                routerLink: (e: Organization) => ['/org', e.slug],
            },
            {
                id: 'name',
                label: 'Name',
                sortable: false,
                value: (e: Organization) => e.name,
            },
            {
                id: 'owner',
                label: 'Owner',
                sortable: false,
                routerLink: (e: Organization) =>
                    e.owner?.username ? ['../org', e.slug, 'member', e.owner.username] : [],
                photoUrl: (element: Organization) =>
                    element.owner ? element.owner.profilePictureUrl : null,
                photoOnly: (e: Organization) => !!e.owner,
                value: (e: Organization) => e.owner?.fullName ?? 'Unknown',
            },
            {
                id: 'created_at',
                label: 'Created At',
                sortable: true,
                value: (e: Organization) => {
                    const date = this.dateService.parseTimestamp(e.createdAt);
                    return this.dateService.toGMTtime(date);
                },
            },
        ];
    }

    getWorktimeColumns(): DisplayedColumn<Worktime>[] {
        return [
            {
                id: 'loggedAt',
                label: 'Date',
                sortable: true,
                value: (e: Worktime) => new Date(e.loggedAt + 'T00:00:00').toLocaleDateString(),
            },
            {
                id: 'minutesSpent',
                label: 'Hours',
                sortable: true,
                value: (e: Worktime) => (e.minutesSpent / 60).toFixed(2),
            },
            {
                id: 'description',
                label: 'Description',
                sortable: false,
                value: (e: Worktime) => e.description,
            },
        ];
    }

    getOrganizationInvitationColumns(): DisplayedColumn<OrganizationInvitation>[] {
        return [
            {
                id: 'organization_id',
                label: 'Organization',
                sortable: false,
                value: (e: OrganizationInvitation) => e.organization?.name ?? 'Unknown',
            },
            {
                id: 'inviter',
                label: 'Invited By',
                sortable: false,
                value: (e: OrganizationInvitation) => e.inviter?.fullName ?? 'Unknown',
                routerLink: (e: OrganizationInvitation) => {
                    if (!e.inviter) return null;
                    return ['../member/', e.inviter.username];
                },
                photoOnly: (e: OrganizationInvitation) => !!e.inviter,
                photoUrl: (e: OrganizationInvitation) => e.inviter?.profilePictureUrl ?? null,
            },
            {
                id: 'role',
                label: 'Role',
                sortable: false,
                value: (e: OrganizationInvitation) =>
                    ORGANIZATION_MEMBER_ROLE_MAP[e.role] ?? e.role,
            },
            {
                id: 'status',
                label: 'Status',
                sortable: true,
                badge: (e: OrganizationInvitation) =>
                    ORGANIZATION_INVITATION_STATUS_COLOR_MAP[e.status],
                value: (e: OrganizationInvitation) =>
                    ORGANIZATION_INVITATION_STATUS_MAP[e.status] ?? e.status,
            },
            {
                id: 'expires_at',
                label: 'Expires At',
                sortable: true,
                value: (e: OrganizationInvitation) => {
                    const date = this.dateService.parseTimestamp(e.expiresAt);
                    return this.dateService.toGMTtime(date);
                },
            },
        ];
    }
}
