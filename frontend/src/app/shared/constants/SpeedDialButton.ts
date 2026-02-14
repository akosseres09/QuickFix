export interface SpeedDialButton {
    iconName: string;
    label: string;
    shown?: boolean;
    action: () => void;
}
