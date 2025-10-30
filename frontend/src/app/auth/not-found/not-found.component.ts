import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../shared/services/user/user.service';
import { User } from '../../shared/model/User';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-not-found',
    imports: [CommonModule, MatIcon],
    templateUrl: './not-found.component.html',
    styleUrl: './not-found.component.css',
})
export class NotFoundComponent implements OnInit, OnDestroy {
    glitchActive = false;
    floatingOffset = 0;
    rotationOffset = 0;
    floatingTickets: Array<{
        left: number;
        top: number;
        delay: number;
        duration: number;
        rotation: number;
        id: number;
    }> = [];
    userService = inject(UserService);
    user: User | null = this.userService.getUser();

    private glitchInterval?: number;
    private floatInterval?: number;

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.floatingTickets = Array.from({ length: 20 }, () => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 3 + Math.random() * 4,
            rotation: Math.random() * 30 - 15,
            id: Math.floor(Math.random() * 9999) + 1000,
        }));

        this.glitchInterval = window.setInterval(() => {
            this.glitchActive = true;
            setTimeout(() => (this.glitchActive = false), 200);
        }, 4000);

        this.floatInterval = window.setInterval(() => {
            const time = Date.now() / 1000;
            this.floatingOffset = Math.sin(time) * 15;
            this.rotationOffset = Math.sin(time * 0.5) * 5;
        }, 50);
    }

    ngOnDestroy(): void {
        if (this.glitchInterval) clearInterval(this.glitchInterval);
        if (this.floatInterval) clearInterval(this.floatInterval);
    }

    goBack(): void {
        window.history.back();
    }

    goHome(): void {
        if (this.user) {
            this.router.navigate(['/issues']);
        } else {
            this.router.navigate(['/']);
        }
    }

    viewAllIssues(): void {
        this.router.navigate(['/issues']);
    }
}
