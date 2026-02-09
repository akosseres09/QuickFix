/**
 * Pagination metadata from Yii2 REST API
 */
export interface PaginationMeta {
    totalCount: number;
    pageCount: number;
    currentPage: number;
    perPage: number;
}
