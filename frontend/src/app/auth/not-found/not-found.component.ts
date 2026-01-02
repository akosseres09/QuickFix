import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../shared/services/user/user.service';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-not-found',
    imports: [CommonModule, MatIcon],
    templateUrl: './not-found.component.html',
    styleUrl: './not-found.component.css',
})
export class NotFoundComponent {
    glitchActive = signal(false);
    floatingOffset = signal(0);
    rotationOffset = signal(0);

    private router = inject(Router);
    private userService = inject(UserService);
    private destroyRef = inject(DestroyRef);

    protected user = signal(this.userService.getUser());
    floatingTickets = Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 4,
        rotation: Math.random() * 30 - 15,
        id: Math.floor(Math.random() * 9999) + 1000,
    }));

    constructor() {
        this.setupGlitchAnimation();
        this.setupFloatingAnimation();
    }

    private setupGlitchAnimation() {
        const interval = setInterval(() => {
            this.glitchActive.set(true);
            setTimeout(() => this.glitchActive.set(false), 200);
        }, 4000);

        this.destroyRef.onDestroy(() => clearInterval(interval));
    }

    private setupFloatingAnimation() {
        const interval = setInterval(() => {
            const time = Date.now() / 1000;
            this.floatingOffset.set(Math.sin(time) * 15);
            this.rotationOffset.set(Math.sin(time * 0.5) * 5);
        }, 50);

        this.destroyRef.onDestroy(() => clearInterval(interval));
    }

    goBack(): void {
        window.history.back();
    }

    goHome(): void {
        if (this.user()) {
            this.router.navigate(['/issues']);
        } else {
            this.router.navigate(['/']);
        }
    }

    viewAllIssues(): void {
        this.router.navigate(['/issues']);
    }
}
