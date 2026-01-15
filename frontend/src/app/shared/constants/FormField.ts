import { ValidatorFn } from '@angular/forms';

export const PASSWORD = 'password';
export const TEXT = 'text';
export const TEXTAREA = 'textarea';
export const NUMBER = 'number';
export const EMAIL = 'email';

export interface FormField {
    name: string;
    label: string;
    type: typeof PASSWORD | typeof TEXT | typeof TEXTAREA | typeof NUMBER | typeof EMAIL;
    value: string;
    required: boolean;
    placeholder?: string;
    validators?: Array<ValidatorFn>;
    errorText: Map<string, string>;
}
