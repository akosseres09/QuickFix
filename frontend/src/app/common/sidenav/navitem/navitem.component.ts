import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AppRoute } from '../../../shared/constants/Routes';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

    ngOnChanges(changes: SimpleChanges): void {
        this.isCollapsed = changes['isCollapsed'].currentValue;
    }
}
