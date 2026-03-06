import { PageEvent } from '@angular/material/paginator';
import { ApiQueryParams } from '../api/ApiQueryParams';
import { Sort, SortDirection } from '@angular/material/sort';
import { signal, WritableSignal } from '@angular/core';
import { UrlService } from '../../services/url/url.service';
import { ActivatedRoute } from '@angular/router';

/**
 * Configuration options for creating a new ListState instance
 */
export interface ListStateConfig {
    /** Default page size (default: 20) */
    defaultPageSize?: number;
    /** Fields to expand in API response (e.g., 'owner,members') */
    expand?: string;
}

/**
 * Encapsulates list state (pagination, sorting, filtering) and URL synchronization.
 * Create one instance per list component using ListStateService.create()
 */
export class ListState {
    // Pagination signals
    readonly pageSize: WritableSignal<number>;
    readonly pageIndex: WritableSignal<number>;

    // Sorting signals
    readonly sortActive: WritableSignal<string>;
    readonly sortDirection: WritableSignal<SortDirection>;

    // Filter signals
    readonly filters: WritableSignal<ApiQueryParams>;

    // Loading state
    readonly isLoading: WritableSignal<boolean>;
    readonly totalCount: WritableSignal<number>;

    private initialFilterLoad = true;
    private readonly expand: string | undefined;
    private readonly defaultPageSize: number;

    constructor(
        private readonly urlService: UrlService,
        private readonly activeRoute: ActivatedRoute,
        config: ListStateConfig = {}
    ) {
        this.defaultPageSize = config.defaultPageSize ?? 20;
        this.expand = config.expand;

        // Initialize signals
        this.pageSize = signal<number>(this.defaultPageSize);
        this.pageIndex = signal<number>(0);
        this.sortActive = signal<string>('');
        this.sortDirection = signal<SortDirection>('asc');
        this.filters = signal<ApiQueryParams>({});
        this.isLoading = signal<boolean>(false);
        this.totalCount = signal<number>(0);

        // Initialize from URL query params
        this.initFromQueryParams();
    }

    /**
     * Initialize state from URL query parameters
     */
    private initFromQueryParams(): void {
        const queryParamMap = this.activeRoute.snapshot.queryParamMap;

        const pageSizeParam = queryParamMap.get('pageSize');
        const pageParam = queryParamMap.get('page');
        const sortParam = queryParamMap.get('sort');

        if (pageSizeParam) {
            this.pageSize.set(+pageSizeParam);
        }
        if (pageParam) {
            // Convert from 1-based (URL/API) to 0-based (Material table)
            this.pageIndex.set(+pageParam - 1);
        }
        if (sortParam) {
            const isAsc = !sortParam.startsWith('-');
            this.sortActive.set(isAsc ? sortParam : sortParam.substring(1));
            this.sortDirection.set(isAsc ? 'asc' : 'desc');
        }
    }

    /**
     * Handle sort change events from the table.
     * Updates internal state and URL, then calls the provided callback.
     * @param event Sort event from MatSort
     * @param onComplete Callback to execute after state update (e.g., fetch data)
     */
    onSortChange(event: Sort, onComplete?: () => void): void {
        this.sortActive.set(event.active);
        this.sortDirection.set(event.direction);

        if (event.direction === '') {
            this.urlService.removeQueryParams(['sort']);
        } else {
            const direction = event.direction === 'asc' ? '' : '-';
            this.urlService.addQueryParams({
                sort: `${direction}${event.active}`,
            });
        }

        this.pageIndex.set(0);
        onComplete?.();
    }

    /**
     * Handle page change events from the paginator.
     * Updates internal state and URL, then calls the provided callback.
     * @param event PageEvent from MatPaginator
     * @param onComplete Callback to execute after state update (e.g., fetch data)
     */
    onPageChange(event: PageEvent, onComplete?: () => void): void {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);

        this.urlService.addQueryParams({
            page: event.pageIndex + 1,
            pageSize: event.pageSize,
        });

        onComplete?.();
    }

    /**
     * Handle filter changes.
     * Updates internal state and URL, then calls the provided callback.
     * @param filterParams New filter parameters
     * @param onComplete Callback to execute after state update (e.g., fetch data)
     */
    onFilterChange(filterParams: ApiQueryParams, onComplete?: () => void): void {
        this.filters.set(filterParams);

        // Reset to first page on filter change, but not on initial load
        if (!this.initialFilterLoad) {
            this.pageIndex.set(0);
            this.urlService.removeQueryParams(['page']);
        }
        this.initialFilterLoad = false;

        this.syncUrlParams();
        onComplete?.();
    }

    /**
     * Build query params for API requests.
     * Includes filters, pagination, sorting, and expansion.
     */
    buildQueryParams(): ApiQueryParams {
        const params: ApiQueryParams = {
            ...this.filters(),
            // Convert from 0-based (Material table) to 1-based (API)
            page: this.pageIndex() > 0 ? this.pageIndex() + 1 : null,
            pageSize: this.pageSize() !== this.defaultPageSize ? this.pageSize() : null,
            sort: this.sortDirection()
                ? `${this.sortDirection() === 'desc' ? '-' : ''}${this.sortActive()}`
                : null,
            expand: this.expand ?? null,
        };

        return params;
    }

    /**
     * Build query params for URL (excludes 'expand' and filters out null/empty values)
     */
    buildUrlParams(): ApiQueryParams {
        const params = this.buildQueryParams();
        const { expand, ...urlParams } = params;

        const cleanParams: ApiQueryParams = {};
        Object.entries(urlParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                cleanParams[key] = value;
            } else {
                cleanParams[key] = null;
            }
        });

        return cleanParams;
    }

    /**
     * Sync current state to URL query params
     */
    syncUrlParams(): void {
        this.urlService.addQueryParams(this.buildUrlParams());
    }
}
