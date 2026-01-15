import { Component, inject, signal } from '@angular/core';
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
    private sidebarService = inject(SidebarService);
    isSidebarCollapsed = signal<boolean>(this.sidebarService.getState());

    onSidebar(event: boolean) {
        this.isSidebarCollapsed.set(event);
    }
}
