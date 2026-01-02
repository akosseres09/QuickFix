import { Component, inject, input } from '@angular/core';
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
export class NavitemComponent {
    routes = input<Array<AppRoute>>([]);
    isCollapsed = input<boolean>(false);
    route = inject(ActivatedRoute);
    router = inject(Router);
    matchOption: IsActiveMatchOptions = {
        matrixParams: 'ignored',
        queryParams: 'ignored',
        fragment: 'ignored',
        paths: 'exact',
    };

    isChildrenActive(children: Array<ChildRoute>): boolean {
        return children.some((child) => this.router.isActive(child.path, this.matchOption));
    }
}
