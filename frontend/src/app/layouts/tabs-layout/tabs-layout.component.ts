import { CommonModule } from '@angular/common';
import { Component, inject, model } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Tab } from '../../shared/constants/Tab';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';

@Component({
    selector: 'app-tabs-layout',
    imports: [CommonModule, RouterModule, MatTabNav, MatTabLink],
    templateUrl: './tabs-layout.component.html',
    styleUrl: './tabs-layout.component.css',
})
export class TabsLayoutComponent {
    private route = inject(ActivatedRoute);
    tabs = model<Tab[]>(this.route.snapshot.data['tabs'] ?? []);
    protected tabPanel: MatTabNavPanel = new MatTabNavPanel();
}
