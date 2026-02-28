import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root',
})
export class SnackbarService {
    constructor(private snackbar: MatSnackBar) {}

    open(message: string, panel: Array<string> = ['snackbar-success']) {
        this.snackbar.open(message, 'Close', {
            duration: 3000,
            panelClass: panel,
        });
    }

    success(message: string) {
        this.open(message, ['snackbar-success']);
    }

    error(message: string) {
        this.open(message, ['snackbar-error']);
    }
}
