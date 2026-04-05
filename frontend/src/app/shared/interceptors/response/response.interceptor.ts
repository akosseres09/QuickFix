import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

/**
 * Unwraps the backend's standardized response envelope so that services
 * and components continue to receive the same shapes they always have:
 *
 * - Paginated:  { success, data: [], _meta, _links }  →  { items: [], _meta, _links }
 * - Single:     { success, data: { … } }               →  { … }
 *
 * Error responses (non-2xx) are not affected — they arrive as
 * HttpErrorResponse with the envelope intact for error handlers.
 */
export const responseInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        map((event) => {
            if (
                event instanceof HttpResponse &&
                event.body &&
                typeof event.body === 'object' &&
                'success' in event.body &&
                'data' in event.body
            ) {
                const body = event.body as Record<string, any>;

                if (body['success'] === true) {
                    // non paginated: { success, data: [...] } or { success, data: { ... } }
                    if (Array.isArray(body['data'])) {
                        if (!body['_meta']) {
                            return event.clone({
                                body: {
                                    items: body['data'],
                                },
                            });
                        }

                        // Paginated: { success, data: [...], _meta, _links }
                        return event.clone({
                            body: {
                                items: body['data'],
                                _meta: body['_meta'],
                                ...(body['_links'] ? { _links: body['_links'] } : {}),
                            },
                        });
                    }

                    // Single object / custom action: { success, data: { ... } }
                    return event.clone({
                        body: body['data'],
                    });
                }
            }
            return event;
        })
    );
};
