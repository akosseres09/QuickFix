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

type CheckBoxFilter = {
    type: 'checkbox';
    label: string;
};

export type Filter = BaseFilter & (InputFilter | SelectFilter | CheckBoxFilter);
