/**
 * Unified interface for all API query parameters
 * Includes:
 *   - Model attribute filters (e.g., name, status)
 *   - Pagination (page, pageSize)
 *   - Sorting (sort)
 *   - Expansion (expand)
 */
export interface ApiQueryParams {
    // Pagination
    page?: number | null;
    pageSize?: number | null;
    // Sorting (e.g., 'createdAt' or '-createdAt' for descending)
    sort?: string | null;
    // Expansion (e.g., 'owner,members')
    expand?: string | null;
    // Dynamic filters based on model attributes
    [param: string]: string | number | boolean | null | undefined;
}
