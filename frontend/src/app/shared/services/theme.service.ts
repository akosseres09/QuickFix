import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    theme: 'light' | 'dark' =
        (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
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
