import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { OrganizationInvitationService } from '../../../shared/services/organization-invitation/organization-invitation.service';
import { SnackbarService } from '../../../shared/services/snackbar/snackbar.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import {
    OrganizationInvitation,
    OrganizationInvitationStatus,
} from '../../../shared/model/OrganizationInvitation';

@Component({
    selector: 'app-organization-invite',
    imports: [TitleCasePipe, MatButtonModule, CommonModule],
    templateUrl: './organization-invitation-item.component.html',
    styleUrl: './organization-invitation-item.component.css',
})
export class OrganizationInvitationItemComponent implements OnInit {
    private readonly organizationInvitationService = inject(OrganizationInvitationService);
    private readonly snacbarService = inject(SnackbarService);
    private readonly authService = inject(AuthService);

    token = input.required<string>();
    currentUser = this.authService.currentUserClaims();
    invitation = signal<OrganizationInvitation | null>(null);
    isSubmitting = signal(false);
    currentAction = signal<'accept' | 'decline' | null>(null);
    invitationStatus = OrganizationInvitationStatus;
    isLoading = signal(true);

    ngOnInit(): void {
        const token = this.token();
        const claims = this.currentUser;
        if (!token || !claims?.email) {
            console.error('Token and organization ID are required');
            return;
        }

        this.organizationInvitationService
            .getInvitationByToken(token, {
                expand: 'organization, inviter',
            })
            .subscribe({
                next: (invitation) => {
                    this.invitation.set(invitation);
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error('Failed to fetch invitation:', err);
                    this.snacbarService.error(err.error?.message ?? 'Failed to load invitation');
                    this.isLoading.set(false);
                },
            });
    }

    acceptInvitation(): void {
        this.updateInvitationStatus(OrganizationInvitationStatus.Accepted, 'accept');
    }

    declineInvitation(): void {
        this.updateInvitationStatus(OrganizationInvitationStatus.Rejected, 'decline');
    }

    private updateInvitationStatus(
        status: OrganizationInvitationStatus.Accepted | OrganizationInvitationStatus.Rejected,
        action: 'accept' | 'decline'
    ): void {
        const invitation = this.invitation();
        if (!invitation || invitation.status !== OrganizationInvitationStatus.Pending) {
            return;
        }

        this.isSubmitting.set(true);
        this.currentAction.set(action);

        this.organizationInvitationService
            .updateInvitation(invitation.token, { status })
            .subscribe({
                next: (updatedInvitation) => {
                    this.invitation.set(updatedInvitation);
                    this.snacbarService.success(
                        action === 'accept'
                            ? 'Invitation accepted successfully'
                            : 'Invitation declined successfully'
                    );
                },
                error: (err) => {
                    console.error(`Failed to ${action} invitation:`, err);
                    this.snacbarService.error(
                        action === 'accept'
                            ? 'Failed to accept invitation'
                            : 'Failed to decline invitation'
                    );
                },
                complete: () => {
                    this.isSubmitting.set(false);
                    this.currentAction.set(null);
                },
            });
    }
}
