import { Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import {
    Issue,
    PRIORITY_MAP,
    PRIORITY_COLOR_MAP,
    TYPE_MAP,
    TYPE_COLOR_MAP,
} from '../../shared/model/Issue';
import { IssueService } from '../../shared/services/issue/issue.service';
import { CommonModule } from '@angular/common';
import { ListComponent, SortableColumn } from '../../common/list/list.component';
import { ListItemDirective } from '../../common/list/list-item.directive';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';
import { SpeedDialComponent } from '../../common/speed-dial/speed-dial.component';
import { SpeedDialButton } from '../../shared/constants/speed-dial/SpeedDialButton';
import { Sort } from '@angular/material/sort';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { Filter } from '../../shared/constants/Filter';
import { FilterComponent } from '../../common/filter/filter.component';
import { DialogService } from '../../shared/services/dialog/dialog.service';
import { finalize } from 'rxjs';
import { FilterService } from '../../shared/services/filter/filter.service';
import { ListState } from '../../shared/constants/table/ListState';
import { ListStateService } from '../../shared/services/list-state/list-state.service';
import { Label } from '../../shared/model/Label';
import { LabelService } from '../../shared/services/label/label.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { IssuePermissions } from '../../shared/constants/user/Permissions';
import { BadgeComponent } from '../../common/badge/badge.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RelativeTimePipe } from '../../shared/pipes/relative-time/relative-time.pipe';
import { GMTPipe } from '../../shared/pipes/gmt/gmt.pipe';

@Component({
    selector: 'app-issues',
    imports: [
        CommonModule,
        ListComponent,
        ListItemDirective,
        SpeedDialComponent,
        FilterComponent,
        BadgeComponent,
        RouterLink,
        MatIconModule,
        MatTooltipModule,
        RelativeTimePipe,
        GMTPipe,
    ],
    templateUrl: './issues.component.html',
    styleUrl: './issues.component.css',
})
export class IssuesComponent implements OnInit {
    private readonly snackbarService = inject(SnackbarService);
    private readonly issueService = inject(IssueService);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly filterService = inject(FilterService);
    private readonly listStateService = inject(ListStateService);
    private readonly dialogService = inject(DialogService);
    private readonly labelService = inject(LabelService);
    private readonly authService = inject(AuthService);

    private readonly currentUser = this.authService.currentClaimsWithPermissions;

    // List state (pagination, sorting, filtering)
    readonly listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 20,
        expand: 'creator,assignee,label',
    });

    projectId = input.required<string>();
    organizationId = input.required<string>();

    selectedRow = signal<Issue | null>(null);

    filteredIssues = signal<Issue[]>([]);
    labels = signal<Label[]>([]);

    // Expose maps for the template
    readonly priorityMap = PRIORITY_MAP;
    readonly priorityColorMap = PRIORITY_COLOR_MAP;
    readonly typeMap = TYPE_MAP;
    readonly typeColorMap = TYPE_COLOR_MAP;

    readonly issueSortableColumns: SortableColumn[] = [
        { id: 'title', label: 'Title' },
        { id: 'type', label: 'Type' },
        { id: 'priority', label: 'Priority' },
        { id: 'createdAt', label: 'Created At' },
    ];

    // Transform the signal into a computed signal
    speedDialButtons = computed<SpeedDialButton[]>(() => {
        const selected = this.selectedRow();
        const user = this.currentUser();
        if (!user) return [];

        const ctx = { projectId: this.projectId(), orgId: this.organizationId() };
        const canUpdate = !!selected && user.canDo(IssuePermissions.UPDATE, ctx);

        return [
            {
                iconName: 'add',
                label: 'Create Issue',
                shown: !selected && user.canDo(IssuePermissions.CREATE, ctx),
                action: () => ['add'],
            },
            {
                iconName: 'archive',
                label: 'Archive Issue',
                shown: canUpdate && !selected.isArchived,
                onClick: () => this.openArchiveConfirmation(),
            },
            {
                iconName: 'unarchive',
                label: 'Unarchive Issue',
                shown: canUpdate && !!selected?.isArchived,
                onClick: () => this.openUnarchiveConfirmation(),
            },
            {
                iconName: 'edit',
                label: 'Edit Issue',
                shown: canUpdate,
                action: () => {
                    const issueId = this.selectedRow()?.id;
                    if (!issueId) {
                        this.snackbarService.error('Please select a valid issue to edit!');
                        return null;
                    }
                    return ['../issue', issueId, 'edit'];
                },
            },
        ];
    });

    filteredFields = computed<Filter[]>(() => this.filterService.getIssueFilters(this.labels()));

    // template refs
    speedDial = viewChild<SpeedDialComponent>('speedDial');
    archiveConfirmTemplate = viewChild<any>('archiveConfirmTemplate');
    unarchiveConfirmTemplate = viewChild<any>('unarchiveConfirmTemplate');

    ngOnInit(): void {
        this.loadLabels();
    }

    private getIssues() {
        const projectId = this.projectId();
        const organizationId = this.organizationId();
        if (!projectId) {
            this.snackbarService.error('Project ID is missing');
            return;
        }

        if (!organizationId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.listState.isLoading.set(true);

        this.issueService
            .getIssues({ projectId, organizationId }, this.listState.buildQueryParams())
            .pipe(finalize(() => this.listState.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.filteredIssues.set(response.items);
                    this.listState.totalCount.set(response._meta.totalCount);
                },
                error: (error) => {
                    console.error('Error fetching issues:', error);
                    this.snackbarService.error('Failed to load issues');
                },
            });
    }

    private loadLabels() {
        const projectId = this.projectId();
        const organizationId = this.organizationId();
        if (!projectId || !organizationId) {
            console.error('Project ID or Organization ID is missing');
            return;
        }

        this.labelService
            .getLabelsToProject({ organizationId, projectId })
            .pipe(finalize(() => this.getIssues()))
            .subscribe({
                next: (response) => {
                    this.labels.set(response.items);
                },
                error: (error) => {
                    console.error('Error fetching labels:', error);
                    this.snackbarService.error('Failed to load labels');
                },
            });
    }

    /**
     * Handles sort change events from the table, updates the URL and fetches new data.
     */
    onSortChange(event: Sort) {
        this.listState.onSortChange(event, () => this.getIssues());
    }

    /**
     * Handles page change events from the paginator, updates the URL and fetches new data.
     */
    onPageChange(event: PageEvent) {
        this.listState.onPageChange(event, () => this.getIssues());
    }

    /**
     * Handles row selection changes from the custom table.
     * @param issue The currently selected issue. If null, it means the selection was cleared.
     */
    onRowChange(issue: Issue | null) {
        if (!issue) {
            this.selectedRow.set(null);
            this.speedDial()?.close();
            return;
        }

        this.selectedRow.set(issue);

        if (issue && this.speedDial()?.isOpen()) return;

        this.speedDial()?.onTogglerClick();
    }

    /**
     * Handles filter changes emitted from the ProjectFilterComponent.
     */
    onFilterChange(filterParams: ApiQueryParams) {
        this.listState.onFilterChange(filterParams, () => this.getIssues());
    }

    openArchiveConfirmation() {
        const template = this.archiveConfirmTemplate();
        if (!template) {
            this.snackbarService.open('Error opening confirmation dialog', ['snackbar-error']);
            return;
        }

        const dialogRef = this.dialogService.openConfirmDialog('Archive Issue', template, {
            confirmLabel: 'Archive',
            cancelLabel: 'Cancel',
            width: '450px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.action === 'save') {
                this.archiveIssue();
            }
        });
    }

    openUnarchiveConfirmation() {
        const template = this.unarchiveConfirmTemplate();
        if (!template) {
            this.snackbarService.error('Error opening confirmation dialog');
            return;
        }

        const dialogRef = this.dialogService.openConfirmDialog('Unarchive Issue', template, {
            confirmLabel: 'Unarchive',
            cancelLabel: 'Cancel',
            width: '450px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.action === 'save') {
                this.unarchiveIssue();
            }
        });
    }

    archiveIssue() {
        const issue = this.selectedRow();
        if (!issue) {
            this.snackbarService.error('No Issue selected');
            return;
        }

        const projectId = this.projectId();
        if (!projectId) {
            this.snackbarService.error('Project ID is missing');
            return;
        }

        const organizationId = this.organizationId();
        if (!organizationId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.issueService
            .updateIssue({
                issueId: issue.id,
                projectId: projectId,
                organizationId: organizationId,
                issue: {
                    isArchived: true,
                },
            })
            .pipe(
                finalize(() => {
                    this.selectedRow.set(null);
                    this.speedDial()?.close();
                    this.getIssues();
                })
            )
            .subscribe({
                next: () => {
                    this.snackbarService.success('Issue archived successfully!');
                },
                error: (err) => {
                    this.snackbarService.error('Failed to archive issue!');
                },
            });
    }

    unarchiveIssue() {
        const issue = this.selectedRow();
        if (!issue) {
            this.snackbarService.error('No Issue selected');
            return;
        }

        const projectId = this.projectId();
        if (!projectId) {
            this.snackbarService.error('Project ID is missing');
            return;
        }

        const organizationId = this.organizationId();
        if (!organizationId) {
            this.snackbarService.error('Organization ID is missing');
            return;
        }

        this.issueService
            .updateIssue({
                issueId: issue.id,
                projectId: projectId,
                organizationId: organizationId,
                issue: {
                    isArchived: false,
                },
            })
            .pipe(
                finalize(() => {
                    this.selectedRow.set(null);
                    this.speedDial()?.close();
                    this.getIssues();
                })
            )
            .subscribe({
                next: () => {
                    this.snackbarService.success('Issue unarchived successfully!');
                },
                error: (err) => {
                    this.snackbarService.error('Failed to unarchive issue!');
                },
            });
    }
}
