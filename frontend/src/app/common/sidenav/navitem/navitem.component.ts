import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AppRoute, ChildRoute } from '../../../shared/constants/Routes';
import {
    ActivatedRoute,
    IsActiveMatchOptions,
    Router,
    RouterLink,
    RouterLinkActive,
} from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import {
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-navitem',
    imports: [
        RouterLink,
        RouterLinkActive,
        MatIcon,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        CommonModule,
    ],
    templateUrl: './navitem.component.html',
    styleUrl: './navitem.component.css',
})
export class NavitemComponent implements OnChanges {
    @Input() routes: Array<AppRoute> = [];
    @Input() isCollapsed: boolean | null = null;
    route = inject(ActivatedRoute);
    router = inject(Router);
    matchOption: IsActiveMatchOptions = {
        matrixParams: 'ignored',
        queryParams: 'ignored',
        fragment: 'ignored',
        paths: 'exact',
    };

    ngOnChanges(changes: SimpleChanges): void {
        this.isCollapsed = changes['isCollapsed'].currentValue;
    }

    isChildrenActive(children: Array<ChildRoute>): boolean {
        return children.some((child) => this.router.isActive(child.path, this.matchOption));
    }
}
