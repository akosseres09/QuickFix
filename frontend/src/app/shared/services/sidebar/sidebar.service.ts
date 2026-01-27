import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SidebarService {
    CLOSED: 'closed' = 'closed';
    OPEN: 'open' = 'open';
    isOpened: boolean = (localStorage.getItem('sidebar') as string) === this.OPEN;

    constructor() {}

    getState(): boolean {
        return this.isOpened;
    }

    setState(state: 'open' | 'closed') {
        this.isOpened = state.toLowerCase() === this.OPEN;
        localStorage.setItem('sidebar', state.toLowerCase());
    }
}
