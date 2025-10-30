export interface DisplayedColumn {
    id: string;
    label: string;
    sortable: boolean;
    value: (element: any) => string | number | Date;
}
