import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidenavComponent } from '../../common/sidenav/sidenav.component';
import { SidebarService } from '../../shared/services/sidebar/sidebar.service';
import { NavbarComponent } from '../../common/navbar/navbar.component';

@Component({
    selector: 'app-main-layout',
    imports: [NavbarComponent, RouterModule, SidenavComponent],
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
