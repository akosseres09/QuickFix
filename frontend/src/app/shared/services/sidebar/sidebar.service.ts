import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SidebarService {
    private static readonly STORAGE_KEY = 'sidebarOpen';

    readonly isOpen = signal<boolean>(this.loadState());

    toggle(): void {
        this.isOpen.update((open) => !open);
        this.save();
    }

    set(open: boolean): void {
        this.isOpen.set(open);
        this.save();
    }

    private save(): void {
        localStorage.setItem(SidebarService.STORAGE_KEY, JSON.stringify(this.isOpen()));
    }

    private loadState(): boolean {
        const saved = localStorage.getItem(SidebarService.STORAGE_KEY);
        return saved !== null ? JSON.parse(saved) : true;
    }
}
