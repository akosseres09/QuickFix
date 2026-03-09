import { UrlTree } from '@angular/router';
import { BaseModel } from '../../model/BaseModel';

type ColumnBase<T extends BaseModel> = {
    id: string;
    label: string;
    sortable: boolean;
    value: (element: T) => string;
};

/**
 * A column whose value is rendered as a navigable link.
 *
 * - Omit `photoUrl` for a **text-only** link.
 * - Add `photoUrl` for a **photo + text** link.
 * - Add `photoUrl` and set `photoOnly: true` for a **photo-only** link
 *   (`value` is then used as the image `alt` attribute).
 */
export type LinkColumn<T extends BaseModel> = ColumnBase<T> & {
    routerLink: (element: T) => string | any[] | UrlTree | null | undefined;
    photoUrl?: (element: T) => string | null;
    /** When `true`, only the photo is shown — no text label. */
    photoOnly?: (e: T) => boolean;
    badge?: never;
};

/**
 * A column whose value is rendered as a coloured badge.
 * The `badge` function returns either a hex colour string (e.g. `#ff0000`)
 * or a Tailwind CSS class string.
 */
export type BadgeColumn<T extends BaseModel> = ColumnBase<T> & {
    badge: (element: T) => string | null;
    routerLink?: never;
    photoUrl?: never;
    photoOnly?: never;
};

/** A plain text column with no special rendering. */
export type PlainColumn<T extends BaseModel> = ColumnBase<T> & {
    badge?: never;
    routerLink?: never;
    photoUrl?: never;
    photoOnly?: never;
};

export type DisplayedColumn<T extends BaseModel> = LinkColumn<T> | BadgeColumn<T> | PlainColumn<T>;
