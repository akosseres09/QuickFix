import { Component, inject, input } from '@angular/core';
import { SidenavRoute, ChildRoute } from '../../../shared/constants/route/Routes';
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
import { MatButtonModule } from '@angular/material/button';

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
        MatButtonModule,
    ],
    templateUrl: './navitem.component.html',
    styleUrl: './navitem.component.css',
})
export class NavitemComponent {
    routes = input<Array<SidenavRoute>>([]);
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
        return children.some((child) =>
            this.router.isActive(child.path as string, this.matchOption)
        );
    }
}
