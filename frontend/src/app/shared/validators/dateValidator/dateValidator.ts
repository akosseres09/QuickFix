import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        const birthDate = new Date(control.value);
        const today = new Date();

        // Check if date is valid
        if (isNaN(birthDate.getTime())) {
            return { invalidDate: true };
        }

        // Check if date is in the future
        if (birthDate > today) {
            return { futureDate: true };
        }

        // Calculate age
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= minAge ? null : { minAge: { requiredAge: minAge, actualAge: age } };
    };
}

export function maxAgeValidator(maxAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        const birthDate = new Date(control.value);
        const today = new Date();

        if (isNaN(birthDate.getTime())) {
            return { invalidDate: true };
        }

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age <= maxAge ? null : { maxAge: { requiredAge: maxAge, actualAge: age } };
    };
}
