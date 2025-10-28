export type AppRoute =
    | {
          type: 'menu';
          name: string;
          icon?: string;
          children: Array<AppRoute>;
          path?: never;
      }
    | {
          type: 'button';
          name: string;
          path: string;
          icon?: string;
          children?: never;
      };
