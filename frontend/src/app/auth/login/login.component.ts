import { Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
    MatFormField,
    MatInput,
    MatLabel,
    MatPrefix,
    MatSuffix,
} from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../shared/services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    imports: [
        MatInput,
        MatButton,
        MatFormField,
        MatLabel,
        MatIcon,
        MatPrefix,
        MatSuffix,
        RouterLink,
        CommonModule,
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
    pwVisible = false;
    theme: 'light' | 'dark' = 'light';

    constructor(private themeService: ThemeService) {}

    ngOnInit(): void {
        this.theme = this.themeService.getTheme();
    }

    togglePwVisibility(event: MouseEvent) {
        const input = (event.target as HTMLElement)
            .closest('mat-form-field')
            ?.querySelector('input');

        if (input) {
            input.setAttribute(
                'type',
                input.getAttribute('type') === 'password' ? 'text' : 'password'
            );
            this.pwVisible = !this.pwVisible;
        }
    }
}
