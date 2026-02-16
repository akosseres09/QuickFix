type BaseFilter = {
    name: string;
    validators?: any[];
};
type InputFilter = {
    type: 'input';
};

type SelectFilter = {
    type: 'select';
    options: { value: string | number; label: string }[];
};

export type Filter = BaseFilter & (InputFilter | SelectFilter);
