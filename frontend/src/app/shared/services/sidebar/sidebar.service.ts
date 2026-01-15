import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SidebarService {
    CLOSED: 'closed' = 'closed';
    OPEN: 'open' = 'open';
    isCollapsed: boolean = (localStorage.getItem('sidebar') as string) === this.CLOSED;

    constructor() {}

    getState(): boolean {
        return this.isCollapsed;
    }

    setState(state: 'open' | 'closed') {
        this.isCollapsed = state.toLowerCase() === this.CLOSED;
        localStorage.setItem('sidebar', state.toLowerCase());
    }
}
