import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    MatButtonToggle,
    MatButtonToggleChange,
    MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterModule } from '@angular/router';
import { User } from '../../shared/model/User';
import { ThemeService } from '../../shared/services/theme/theme.service';

@Component({
    selector: 'app-navbar',
    imports: [
        RouterModule,
        CommonModule,
        RouterLink,
        FormsModule,
        MatIcon,
        MatButtonToggle,
        MatButtonToggleGroup,
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css',
    standalone: true,
})
export class NavbarComponent implements OnInit, AfterViewInit {
    isMenuOpen = false;
    htmlElement: HTMLElement | null = null;
    theme: 'light' | 'dark' = 'light';
    user: User | null = null;
    routes: Array<{ path: string; name: string; active: boolean }> = [];

    ngOnInit(): void {
        this.htmlElement = document.documentElement;
        let theme: 'light' | 'dark' = this.themeService.getTheme();
        this.setTheme(!theme ? 'light' : (theme as 'light' | 'dark'));

        this.routes = [
            {
                path: '/auth/login',
                name: 'Login',
                active: this.user === null,
            },
            {
                path: '/auth/signup',
                name: 'Sign Up',
                active: this.user === null,
            },
            {
                path: '',
                name: 'Home',
                active: this.user === null,
            },
        ];
    }

    constructor(private themeService: ThemeService) {}

    ngAfterViewInit(): void {
        this.htmlElement = document.documentElement;
        if (!this.htmlElement) return;

        const theme = localStorage.getItem('theme') || 'light';
        this.htmlElement.dataset['theme'] = theme;
    }

    setTheme(theme: 'light' | 'dark') {
        if (!this.htmlElement) return;

        this.themeService.setTheme(theme);
        this.theme = theme;
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    onToggle(event: MatButtonToggleChange) {
        if (!this.htmlElement) return;

        if (['light', 'dark'].indexOf(event.value) === -1) {
            return;
        }

        this.setTheme(event.value);
    }
}
