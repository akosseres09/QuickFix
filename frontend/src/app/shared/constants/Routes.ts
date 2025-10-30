export type AppRoute =
    | {
          type: 'menu';
          name: string;
          show?: boolean;
          children: Array<ChildRoute>;
          icon?: string;
          path?: string;
      }
    | {
          type: 'button';
          name: string;
          path: string;
          show?: boolean;
          icon?: string;
          children?: never;
      };

export type ChildRoute = {
    name: string;
    path: string;
    icon: string;
};
