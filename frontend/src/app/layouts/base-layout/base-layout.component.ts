import { Component } from '@angular/core';
import { NavbarComponent } from '../../common/navbar/navbar.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-base',
    imports: [NavbarComponent, RouterOutlet, FooterComponent, CommonModule],
    templateUrl: './base-layout.component.html',
    styleUrl: './base-layout.component.css',
})
export class BaseLayoutComponent {}
