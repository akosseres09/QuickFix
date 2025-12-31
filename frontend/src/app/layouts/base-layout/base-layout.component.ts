import { Component, inject, OnInit } from '@angular/core';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { User } from '../../shared/model/User';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
    selector: 'app-auth',
    imports: [NavbarComponent, RouterOutlet],
    templateUrl: './base-layout.component.html',
    styleUrl: './base-layout.component.css',
})
export class BaseLayoutComponent implements OnInit {
    user: User | null = null;
    classes = 'flex justify-center';
    router = inject(Router);

    ngOnInit(): void {
        this.checkPage(this.router.url);
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event) => {
                this.checkPage(event.url);
            });
    }

    checkPage(url: string) {
        if (url.match('/projects') || url.match('/worktime')) {
            this.classes = 'max-w-7xl mx-auto';
        }
    }
}
