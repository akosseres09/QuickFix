import { BaseModel } from '../model/BaseModel';

export interface DisplayedColumn<T extends BaseModel> {
    id: string;
    label: string;
    sortable: boolean;
    value: (element: T) => string | number | Date;
    routerLink?: (element: T) => (string | number)[];
}
