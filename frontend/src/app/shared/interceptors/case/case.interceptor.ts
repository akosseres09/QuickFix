import { HttpInterceptorFn } from '@angular/common/http';
import { toSnakeCase } from '../../utils/caseConverter/caseConverter';

export const caseInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.body || req.body instanceof FormData) {
        return next(req);
    }

    const snakeBody = toSnakeCase(req.body);
    const clone = req.clone({ body: snakeBody });
    return next(clone);
};
