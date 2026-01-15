import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ScrollService {
    constructor() {}

    checkScroll(elementId: string): 'hidden' | 'visible' {
        const element = document.getElementById(elementId);
        if (!element) return 'hidden';

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top <= windowHeight * 0.95 && rect.bottom >= 0) {
            return 'visible';
        } else {
            return 'hidden';
        }
    }
}
