import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null; // Don't validate empty values to allow optional controls
        }

        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        const valid = phoneRegex.test(control.value);

        return valid ? null : { invalidPhone: true };
    };
}
