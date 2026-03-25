import {
    Component,
    DestroyRef,
    inject,
    input,
    OnInit,
    output,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectMemberRoles, ROLES } from '../../../../shared/model/ProjectMember';
import { DialogService } from '../../../../shared/services/dialog/dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TitleCasePipe } from '@angular/common';
import { ProjectMemberService } from '../../../../shared/services/project-member/project-member.service';
import { OrganizationMemberService } from '../../../../shared/services/organization-member/organization-member.service';
import { SnackbarService } from '../../../../shared/services/snackbar/snackbar.service';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { OrganizationMember } from '../../../../shared/model/OrganizationMember';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';

@Component({
    selector: 'app-project-invite-dialog',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatAutocompleteModule,
        TitleCasePipe,
    ],
    templateUrl: './project-invite-dialog.component.html',
    styleUrl: './project-invite-dialog.component.css',
})
export class ProjectInviteDialogComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly dialogService = inject(DialogService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly projectMemberService = inject(ProjectMemberService);
    private readonly organizationMemberService = inject(OrganizationMemberService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly authService = inject(AuthService);

    organizationId = input.required<string>();
    projectId = input.required<string>();

    memberAdded = output<void>();

    roles = ROLES.filter((r) => r !== ProjectMemberRoles.OWNER);
    userClaims = this.authService.currentUserClaims();

    filteredMembers = signal<OrganizationMember[]>([]);
    selectedMember = signal<OrganizationMember | null>(null);

    form = this.fb.group({
        member: ['', [Validators.required]],
        role: [ProjectMemberRoles.MEMBER, [Validators.required]],
    });

    inviteFormTemplate = viewChild<TemplateRef<any>>('projectInviteFormTemplate');

    ngOnInit(): void {
        this.form
            .get('member')!
            .valueChanges.pipe(
                debounceTime(300),
                distinctUntilChanged(),
                filter((value) => typeof value === 'string' && value.length >= 2),
                switchMap((value) =>
                    this.organizationMemberService.getOrganizationMembers(this.organizationId(), {
                        expand: 'user',
                        search: value as string,
                        pageSize: 10,
                    })
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (data) => {
                    const currentUserId = this.userClaims?.uid;
                    this.filteredMembers.set(data.items.filter((m) => m.userId !== currentUserId));
                },
                error: () => {
                    this.filteredMembers.set([]);
                },
            });
    }

    displayFn(member: OrganizationMember): string {
        if (!member?.user) return '';
        return `${member.user.fullName} (${member.user.email})`;
    }

    onMemberSelected(member: OrganizationMember): void {
        this.selectedMember.set(member);
    }

    open(): void {
        const template = this.inviteFormTemplate();
        if (!template) return;

        const dialog = this.dialogService.openFormDialog('Add Member to Project', template, {
            saveLabel: 'Add Member',
            saveButtonClass: '',
            saveDisabled: this.form.invalid || !this.selectedMember(),
            width: '600px',
        });

        this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            if (dialog.componentInstance) {
                dialog.componentInstance.data.saveDisabled =
                    this.form.invalid || !this.selectedMember();
            }
        });

        dialog
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                if (result?.action === 'save' && this.form.valid && this.selectedMember()) {
                    this.addMember();
                }
                this.form.reset({ member: '', role: ProjectMemberRoles.MEMBER });
                this.selectedMember.set(null);
                this.filteredMembers.set([]);
            });
    }

    private addMember(): void {
        const member = this.selectedMember();
        const role = this.form.get('role')!.value;
        if (!member || !role) return;

        this.projectMemberService
            .addProjectMember(this.organizationId(), this.projectId(), {
                user_id: member.userId,
                role,
            })
            .subscribe({
                next: () => {
                    this.snackbarService.success('Member added successfully');
                    this.memberAdded.emit();
                },
                error: (err) => {
                    console.error('Failed to add member', err);
                    this.snackbarService.error('Failed to add member');
                },
            });
    }

    get member() {
        return this.form.get('member')!;
    }

    get role() {
        return this.form.get('role')!;
    }
}
