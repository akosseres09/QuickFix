import { UrlTree } from '@angular/router';

export type AppRoute =
    | {
          type: 'menu';
          name: string;
          show?: boolean;
          children: Array<ChildRoute>;
          icon?: string;
          path?: string;
          exact?: boolean;
      }
    | {
          type: 'button';
          name: string;
          path: string | any[] | UrlTree | null | undefined;
          show?: boolean;
          icon?: string;
          children?: never;
          exact?: boolean;
      };

export type ChildRoute = {
    name: string;
    path: string;
    icon: string;
};
