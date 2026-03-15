import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { finalize } from 'rxjs';
import { FilterComponent } from '../../common/filter/filter.component';
import { TableComponent } from '../../common/table/table.component';
import { ApiQueryParams } from '../../shared/constants/api/ApiQueryParams';
import { Filter } from '../../shared/constants/Filter';
import { ListState } from '../../shared/constants/table/ListState';
import { DisplayedColumn } from '../../shared/constants/table/DisplayedColumn';
import { OrganizationInvitation } from '../../shared/model/OrganizationInvitation';
import { DisplayedColumnService } from '../../shared/services/displayed-column/displayed-column.service';
import { FilterService } from '../../shared/services/filter/filter.service';
import { ListStateService } from '../../shared/services/list-state/list-state.service';
import { OrganizationInvitationService } from '../../shared/services/organization-invitation/organization-invitation.service';
import { SnackbarService } from '../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-organization-invitation',
    imports: [FilterComponent, TableComponent],
    templateUrl: './organization-invitation.component.html',
    styleUrl: './organization-invitation.component.css',
})
export class OrganizationInvitationComponent {
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly invitationService = inject(OrganizationInvitationService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly filterService = inject(FilterService);
    private readonly displayedColumnService = inject(DisplayedColumnService);
    private readonly listStateService = inject(ListStateService);
    private readonly router = inject(Router);

    readonly listState: ListState = this.listStateService.create(this.activeRoute, {
        defaultPageSize: 20,
        expand: 'organization,inviter',
    });

    selectedRow = signal<OrganizationInvitation | null>(null);
    invitations = signal<OrganizationInvitation[]>([]);

    shownInvitations = computed(
        () => new MatTableDataSource<OrganizationInvitation>(this.invitations())
    );

    displayedColumns = signal<DisplayedColumn<OrganizationInvitation>[]>(
        this.displayedColumnService.getOrganizationInvitationColumns()
    );

    filterFields: Filter[] = this.filterService.getOrganizationInvitationFilters();

    getInvitations() {
        this.listState.isLoading.set(true);

        this.invitationService
            .getInvitations(this.listState.buildQueryParams())
            .pipe(finalize(() => this.listState.isLoading.set(false)))
            .subscribe({
                next: (response) => {
                    this.invitations.set(response.items);
                    this.listState.totalCount.set(response._meta.totalCount);
                },
                error: (error) => {
                    console.error('Failed to load invitations', error);
                    this.snackbarService.error('Failed to load invitations');
                },
            });
    }

    onSortChange(event: Sort) {
        this.listState.onSortChange(event, () => this.getInvitations());
    }

    onPageChange(event: PageEvent) {
        this.listState.onPageChange(event, () => this.getInvitations());
    }

    onFilterChange(filterParams: ApiQueryParams) {
        this.listState.onFilterChange(filterParams, () => this.getInvitations());
    }

    onRowChange(invitation: OrganizationInvitation | null) {
        this.selectedRow.set(invitation);

        if (!invitation) return;

        this.router.navigate(['../invitation', invitation.id], { relativeTo: this.activeRoute });
    }
}
