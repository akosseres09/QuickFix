import { Injectable } from '@angular/core';
import { ACTIVE, ADMIN, User } from '../../model/User';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    user: User | null = null;

    constructor(private router: Router) {}

    getUser(): User | null {
        if (!this.router.url.includes('/auth')) {
            this.user = {
                id: '1',
                username: 'Admin',
                email: 'admin@example.com',
                created_at: new Date(),
                status: ACTIVE,
                role: ADMIN,
            };
        } else {
            this.user = null;
        }

        return this.user;
    }
}
