import { Component, inject, OnInit, signal } from '@angular/core';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { User } from '../../shared/model/User';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { FooterComponent } from '../../common/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-base',
    imports: [NavbarComponent, RouterOutlet, FooterComponent, CommonModule],
    templateUrl: './base-layout.component.html',
    styleUrl: './base-layout.component.css',
})
export class BaseLayoutComponent implements OnInit {
    user = signal<User | null>(null);
    innerPage = signal<boolean>(false);
    router = inject(Router);
    activeRoute = inject(ActivatedRoute);

    ngOnInit(): void {
        this.checkPage(this.router.url);
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event) => {
                this.checkPage(event.url);
            });
    }

    checkPage(url: string) {
        if (url.match('/(organizations|worktime|account|settings)')) {
            this.innerPage.set(true);
        } else {
            this.innerPage.set(false);
        }
    }
}
