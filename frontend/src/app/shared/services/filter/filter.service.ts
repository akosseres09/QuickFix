import { Injectable } from '@angular/core';
import {
    PRIORITY_MAP as ISSUE_PRIORITY_MAP,
    STATUS_MAP as ISSUE_STATUS_MAP,
    TYPE_MAP as ISSUE_TYPE_MAP,
} from '../../model/Issue';
import { Filter } from '../../constants/Filter';
import {
    PRIORITY_MAP as PROJECT_PRIORITY_MAP,
    STATUS_MAP as PROJECT_STATUS_MAP,
} from '../../model/Project';

@Injectable({
    providedIn: 'root',
})
export class FilterService {
    constructor() {}

    getIssueFilters(): Filter[] {
        return [
            {
                name: 'title',
                type: 'input',
            },
            {
                name: 'status',
                type: 'select',
                options: Object.entries(ISSUE_STATUS_MAP).map(([value, label]) => ({
                    value,
                    label,
                })),
            },
            {
                name: 'priority',
                type: 'select',
                options: Object.entries(ISSUE_PRIORITY_MAP).map(([value, label]) => ({
                    value,
                    label,
                })),
            },
            {
                name: 'type',
                type: 'select',
                options: Object.entries(ISSUE_TYPE_MAP).map(([value, label]) => ({ value, label })),
            },
            {
                name: 'is_archived',
                type: 'checkbox',
                label: 'Is Archived?',
            },
        ];
    }

    getProjectFilters(): Filter[] {
        return [
            {
                name: 'name',
                type: 'input',
            },
            {
                name: 'status',
                type: 'select',
                options: Object.entries(PROJECT_STATUS_MAP).map(([value, label]) => ({
                    value,
                    label,
                })),
            },
            {
                name: 'priority',
                type: 'select',
                options: Object.entries(PROJECT_PRIORITY_MAP).map(([value, label]) => ({
                    value,
                    label,
                })),
            },
        ];
    }
}
