import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../shared/model/User';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { expand, finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { OrganizationMemberService } from '../../../../shared/services/organization-member/organization-member.service';
import { OrganizationMember } from '../../../../shared/model/OrganizationMember';

@Component({
    selector: 'app-organization-member-item',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatDividerModule,
        MatTooltipModule,
        MatCardModule,
    ],
    templateUrl: './organization-member-item.component.html',
    styleUrl: './organization-member-item.component.css',
})
export class OrganizationMemberItemComponent implements OnInit {
    private readonly organizationMemberService = inject(OrganizationMemberService);
    memberId = input.required<string>();
    organizationId = input.required<string>();

    member = signal<OrganizationMember | null>(null);
    loading = signal(true);

    ngOnInit(): void {
        const memberId = this.memberId();

        if (!memberId) {
            console.error('Member ID is required for OrganizationMemberItemComponent');
            this.loading.set(false);
            return;
        }

        this.organizationMemberService
            .getOrganizationMember(this.organizationId(), memberId, {
                expand: 'user',
            })
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (userData) => {
                    this.member.set(userData);
                },
                error: (err) => {
                    console.error('Error fetching user', err);
                },
            });
    }
}
