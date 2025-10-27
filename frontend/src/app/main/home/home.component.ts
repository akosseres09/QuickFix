import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavbarComponent } from '../../common/navbar/navbar.component';

@Component({
    selector: 'app-home',
    imports: [CommonModule, NavbarComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
})
export class HomeComponent {}
