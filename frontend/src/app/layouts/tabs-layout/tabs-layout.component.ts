import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
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
    @Input() tabs: Array<Tab>;
    private route = inject(ActivatedRoute);
    protected tabPanel: MatTabNavPanel = new MatTabNavPanel();

    constructor() {
        this.tabs = this.route.snapshot.data['tabs'] ?? [];
    }
}
