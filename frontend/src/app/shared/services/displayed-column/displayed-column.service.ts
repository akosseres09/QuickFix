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

@Injectable({
    providedIn: 'root',
})
export class DisplayedColumnService {
    private readonly dateService = inject(DateService);

    getIssueDisplayColumns() {
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
                    return ['/users/', '@' + e.creator.username];
                },
            },

            {
                id: 'assignee',
                label: 'Assignee',
                sortable: false,
                value: (e: Issue) => e.assignee?.username || 'None',
                routerLink: (e: Issue) => {
                    if (!e.assignee?.username) return null;
                    return ['/users/', '@' + e.assignee.username];
                },
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

    getProjectColumns() {
        return [
            {
                id: 'name',
                label: 'Name',
                sortable: true,
                value: (e: Project) => e.name,
                routerLink: (e: Project) => ['/project', e.key],
            },
            {
                id: 'owner',
                label: 'Owner',
                sortable: false,
                value: (e: Project) => e.owner?.username || 'N/A',
                routerLink: (e: Project) => (e.owner?.id ? ['/user', '@' + e.owner.username] : []),
            },
            {
                id: 'users',
                label: '# of users',
                sortable: true,
                value: (e: Project) => e.members?.length || 0,
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
}
