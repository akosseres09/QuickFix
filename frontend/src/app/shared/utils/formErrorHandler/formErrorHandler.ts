import { FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { snakeCaseToCamelCase } from '../caseConverter/caseConverter';

/**
 * Checks whether an HTTP error is a 422 validation error
 * matching the backend's standardized format.
 */
export function isValidationError(error: HttpErrorResponse): boolean {
    return error.status === 422 && error.error?.error?.details != null;
}

/**
 * Applies backend validation errors (422) to Angular form controls.
 *
 * Backend returns field names in snake_case – this automatically maps them
 * to the camelCase control names used by the form.
 *
 * Each matched control receives a `serverError` error key whose value is the
 * array of error messages, making it easy to display in templates:
 *
 * ```html
 * @if (getControl('email')?.hasError('serverError')) {
 *   @for (msg of getControl('email')?.getError('serverError'); track $index) {
 *     <span>{{ msg }}</span>
 *   }
 * }
 * ```
 *
 * @returns `true` if at least one field error was applied, `false` otherwise.
 */
export function applyValidationErrors(form: FormGroup, error: HttpErrorResponse): boolean {
    if (!isValidationError(error)) {
        return false;
    }

    const details = error.error.error.details as Record<string, string[]>;
    let applied = false;

    for (const [field, messages] of Object.entries(details)) {
        const controlName = snakeCaseToCamelCase(field);
        const control = form.get(controlName) ?? form.get(field);
        if (control) {
            control.setErrors({ serverError: messages });
            control.markAsTouched();
            applied = true;
        }
    }

    return applied;
}
