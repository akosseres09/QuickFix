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
                value: (e: Issue) => e.creator?.username || '',
                routerLink: (e: Issue) => {
                    if (!e.creator?.username) return null;
                    return ['/member/', '@' + e.creator.username];
                },
                photoOnly: (e: Issue) => !!e.creator,
                photoUrl: (e: Issue) => e.creator?.profilePictureUrl ?? null,
            },
            {
                id: 'assignee',
                label: 'Assignee',
                sortable: false,
                value: (e: Issue) => e.assignee?.username || 'Not Assigned',
                routerLink: (e: Issue) => {
                    if (!e.assignee?.username) return null;
                    return ['/member/', '@' + e.assignee.username];
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

    getProjectColumns(organizationId: string): DisplayedColumn<Project>[] {
        return [
            {
                id: 'name',
                label: 'Name',
                sortable: true,
                value: (e: Project) => e.name,
                routerLink: (e: Project) => ['/', organizationId, 'project', e.key],
            },
            {
                id: 'owner',
                label: 'Owner',
                sortable: false,
                value: (e: Project) => e.owner?.username || 'N/A',
                routerLink: (e: Project) =>
                    e.owner?.id ? ['/member', '@' + e.owner.username] : [],
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
                value: (e: Organization) => '',
                sortable: false,
                photoOnly: () => true,
                photoUrl: (e: Organization) => e.logoUrl,
                routerLink: (e: Organization) => ['/', e.slug],
            },
            {
                id: 'slug',
                label: 'Slug',
                sortable: true,
                value: (e: Organization) => e.slug,
                routerLink: (e: Organization) => ['/', e.slug],
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
                    e.owner?.id ? ['/member', '@' + e.owner.username] : [],
                photoUrl: (element: Organization) =>
                    element.owner ? element.owner.profilePictureUrl : null,
                photoOnly: (e: Organization) => !!e.owner,
                value: (e: Organization) => e.owner?.username ?? '',
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
}
