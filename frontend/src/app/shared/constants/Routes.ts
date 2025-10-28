export type AppRoute =
    | {
          type: 'menu';
          name?: string;
          active?: boolean;
          children: Array<AppRoute>;
          icon?: string;
          path?: never;
      }
    | {
          type: 'button';
          name: string;
          path: string;
          active?: boolean;
          icon?: string;
          children?: never;
      };
