import { Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { OrganizationFormComponent } from '../../../common/form/organization-form/organization-form.component';
import { MatIconModule } from '@angular/material/icon';
import { Organization } from '../../../shared/model/Organization';
import { OrganizationService } from '../../../shared/services/organization/organization.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { applyValidationErrors } from '../../../shared/utils/formErrorHandler/formErrorHandler';

@Component({
    selector: 'app-edit',
    imports: [OrganizationFormComponent, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './edit-organization.component.html',
    styleUrl: './edit-organization.component.css',
})
export class EditOrganizationComponent implements OnInit {
    private readonly organizationService = inject(OrganizationService);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);
    private readonly formComponent = viewChild(OrganizationFormComponent);

    organizationId = input.required<string>();
    organiation = signal<Organization | null>(null);

    ngOnInit(): void {
        const orgId = this.organizationId();
        if (!orgId) {
            this.snackbarService.error('Organization ID is required');
            this.router.navigate(['/organizations']);
            return;
        }

        this.organizationService.getOrganization(orgId).subscribe({
            next: (org) => {
                this.organiation.set(org);
            },
            error: (err) => {
                console.error('Error fetching organization:', err);
                this.snackbarService.error('Failed to load organization');
                this.router.navigate(['/organizations']);
            },
        });
    }

    editOrganization(organiziation: Partial<Organization>) {
        this.organizationService.updateOrganization(organiziation).subscribe({
            next: () => {
                this.snackbarService.success('Organization updated successfully');
                this.router.navigate(['/organizations']);
            },
            error: (err) => {
                const form = this.formComponent();
                if (form) {
                    applyValidationErrors(form.organizationForm, err);
                    form.isSubmitting.set(false);
                }
                this.snackbarService.error(
                    err.error?.error?.message || 'Failed to update organization'
                );
            },
        });
    }
}
