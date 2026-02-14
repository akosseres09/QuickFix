import { UrlTree } from '@angular/router';

export interface SpeedDialButton {
    iconName: string;
    label: string;
    shown?: boolean;
    action: () => string | any[] | UrlTree | null | undefined;
}
