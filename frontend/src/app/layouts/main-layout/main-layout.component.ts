import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidenavComponent } from '../../common/sidenav/sidenav.component';
import { MainNavbarComponent } from '../../common/main-navbar/main-navbar.component';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';

@Component({
    selector: 'app-main-layout',
    imports: [MainNavbarComponent, RouterModule, SidenavComponent],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
    isSidebarCollapsed: boolean;

    constructor(private sidebarService: SidebarService) {
        this.isSidebarCollapsed = this.sidebarService.getState();
    }

    onSidebar(event: boolean) {
        this.isSidebarCollapsed = event;
    }

    onMouseEnter() {}

    onMouseLeave() {}
}
