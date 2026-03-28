import { Directive, input } from '@angular/core';

export interface ListItemContext<T> {
    $implicit: T;
    selected: boolean;
}

@Directive({
    selector: '[appListItem]',
})
export class ListItemDirective<T> {
    appListItemOf = input<T[]>();

    static ngTemplateContextGuard<T>(
        dir: ListItemDirective<T>,
        ctx: unknown
    ): ctx is ListItemContext<T> {
        return true;
    }
}
