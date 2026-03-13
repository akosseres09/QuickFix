import { Component, DestroyRef, inject, input, TemplateRef, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomValidators } from '../../../../shared/validators/CustomValidators';
import { OrganizationMemberRole } from '../../../../shared/model/OrganizationMember';
import { DialogService } from '../../../../shared/services/dialog/dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TitleCasePipe } from '@angular/common';
import { OrganizationInvitationService } from '../../../../shared/services/organization-invitation/organization-invitation.service';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';

@Component({
    selector: 'app-org-invite-dialog',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        TitleCasePipe,
    ],
    templateUrl: './org-invite-dialog.component.html',
    styleUrl: './org-invite-dialog.component.css',
})
export class OrgInviteDialogComponent {
    private readonly fb = inject(FormBuilder);
    private readonly dialogService = inject(DialogService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly organizationInvitationService = inject(OrganizationInvitationService);
    private readonly snackbarService = inject(SnackbarService);

    organizationId = input.required<string>();
    roles = Object.values(OrganizationMemberRole);

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        role: [
            OrganizationMemberRole.MEMBER,
            [Validators.required, CustomValidators.enum(OrganizationMemberRole)],
        ],
    });

    inviteFormTemplate = viewChild<TemplateRef<any>>('orgInviteFormTemplate');

    open(): void {
        const template = this.inviteFormTemplate();
        const orgId = this.organizationId();
        if (!template || !orgId) {
            return;
        }

        const dialog = this.dialogService.openFormDialog('Invite People', template, {
            saveLabel: 'Send Invite',
            saveButtonClass: '',
            saveDisabled: this.form.invalid,
            width: '600px',
        });

        this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            if (dialog.componentInstance) {
                dialog.componentInstance.data.saveDisabled = this.form.invalid;
            }
        });

        dialog
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                if (result?.action === 'save' && this.form && this.form.valid) {
                    this.sendInvite();
                }
                this.form.reset({ email: '', role: OrganizationMemberRole.MEMBER });
            });
    }

    private sendInvite(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const orgId = this.organizationId();
        if (!orgId) {
            return;
        }

        const { email, role } = this.form.value;
        if (!email || !role) {
            return;
        }

        this.organizationInvitationService
            .sendInvitation(orgId, {
                email,
                role,
            })
            .subscribe({
                next: () => {
                    this.snackbarService.success('Invitation sent successfully');
                },
                error: (err) => {
                    console.error('Failed to send invitation', err);
                    this.snackbarService.error('Failed to send invitation');
                },
            });
    }

    get email() {
        return this.form.get('email')!;
    }

    get role() {
        return this.form.get('role')!;
    }
}
