export interface DisplayedColumn {
    mode: 'data';
    id: string;
    label: string;
    sortable: boolean;
    value: (element: any) => string | number | Date;
}
