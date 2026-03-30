import { Component, inject, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { OrganizationFormComponent } from '../../../common/form/organization-form/organization-form.component';
import { Organization } from '../../../shared/model/Organization';
import { OrganizationService } from '../../../shared/services/organization/organization.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { applyValidationErrors } from '../../../shared/utils/formErrorHandler';

@Component({
    selector: 'app-create',
    imports: [RouterLink, MatIconModule, OrganizationFormComponent],
    templateUrl: './create-organization.component.html',
    styleUrl: './create-organization.component.css',
})
export class CreateOrganizationComponent {
    private readonly organizationService = inject(OrganizationService);
    private readonly router = inject(Router);
    private readonly snackbarService = inject(SnackbarService);
    private readonly formComponent = viewChild(OrganizationFormComponent);

    createOrganization(organization: Partial<Organization>) {
        this.organizationService.createOrganization(organization).subscribe({
            next: (_) => {
                this.snackbarService.success('Organization created successfully');
                this.router.navigate(['/organizations']);
            },
            error: (err) => {
                const form = this.formComponent();
                if (form) {
                    applyValidationErrors(form.organizationForm, err);
                    form.isSubmitting.set(false);
                }
                this.snackbarService.error(
                    err.error?.error?.message || 'Failed to create organization'
                );
            },
        });
    }
}
