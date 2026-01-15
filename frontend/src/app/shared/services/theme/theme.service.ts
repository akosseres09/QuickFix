import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    logos: { [key: string]: string } = {
        light: 'QuickFix_logo_light.png',
        dark: 'QuickFix_logo_dark.png',
    };

    theme: 'light' | 'dark' = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    constructor() {}

    getTheme(): 'light' | 'dark' {
        return this.theme;
    }

    setTheme(theme: 'light' | 'dark'): void {
        this.theme = theme;
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }
}
