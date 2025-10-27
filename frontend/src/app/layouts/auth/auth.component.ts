import { Component } from '@angular/core';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { User } from '../../shared/model/User';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-auth',
    imports: [NavbarComponent, RouterOutlet],
    templateUrl: './auth.component.html',
    styleUrl: './auth.component.css',
})
export class AuthComponent {
    user: User | null = null;
}
