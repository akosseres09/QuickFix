import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { OrganizationFormComponent } from '../../../common/form/organization-form/organization-form.component';
import { Organization } from '../../../shared/model/Organization';
import { OrganizationService } from '../../../shared/services/organization/organization.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';

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

    createOrganization(organization: Partial<Organization>) {
        this.organizationService.createOrganization(organization).subscribe({
            next: (_) => {
                this.snackbarService.success('Organization created successfully');
                this.router.navigate(['/organizations']);
            },
            error: (err) => {
                this.snackbarService.error('Failed to create organization');
                console.error('Error creating organization:', err);
            },
        });
    }
}
