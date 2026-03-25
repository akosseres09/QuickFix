import { CommonModule } from '@angular/common';
import { Component, inject, input, model } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Tab } from '../../shared/constants/Tab';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { AuthService } from '../../shared/services/auth/auth.service';

@Component({
    selector: 'app-tabs-layout',
    imports: [CommonModule, RouterModule, MatTabNav, MatTabLink],
    templateUrl: './tabs-layout.component.html',
    styleUrl: './tabs-layout.component.css',
})
export class TabsLayoutComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);
    protected currentUser = this.authService.currentClaimsWithPermissions;

    tabs = model<Tab[]>(this.route.snapshot.data['tabs'] ?? []);
    protected tabPanel: MatTabNavPanel = new MatTabNavPanel();

    organizationId = input.required<string>();
    projectId = input.required<string>();

    showTab(tab: Tab): boolean {
        const user = this.currentUser();
        if (!user) {
            return false;
        }

        if (!tab.permission) {
            return true;
        }

        return user.canDo(tab.permission, {
            orgId: this.organizationId(),
            projectId: this.projectId(),
        });
    }
}
