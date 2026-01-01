import { Component, inject, OnInit } from '@angular/core';
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
    user: User | null = null;
    router = inject(Router);
    activeRoute = inject(ActivatedRoute);
    innerPage = true;

    ngOnInit(): void {
        this.checkPage(this.router.url);
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event) => {
                this.checkPage(event.url);
            });
    }

    checkPage(url: string) {
        if (url.match('/(projects|worktime|account|settings)')) {
            this.innerPage = false;
        } else {
            this.innerPage = true;
        }
    }
}
