import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UrlService } from '../url/url.service';
import { ListState, ListStateConfig } from '../../constants/table/ListState';

/**
 * Factory service for creating ListState instances.
 * Each list component should create its own instance.
 */
@Injectable({
    providedIn: 'root',
})
export class ListStateService {
    private readonly urlService = inject(UrlService);

    /**
     * Create a new ListState instance for a list component.
     * @param activeRoute The component's ActivatedRoute (required for reading query params)
     * @param config Optional configuration for the list state
     */
    create(activeRoute: ActivatedRoute, config: ListStateConfig = {}): ListState {
        return new ListState(this.urlService, activeRoute, config);
    }
}
