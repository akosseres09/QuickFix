import { PaginationMeta } from './PaginationMeta';

/**
 * Paginated API response structure from Yii2
 */
export interface PaginatedResponse<T> {
    items: T[];
    _meta: PaginationMeta;
    _links: {
        self: { href: string };
        first?: { href: string };
        last?: { href: string };
        next?: { href: string };
        prev?: { href: string };
    };
}
