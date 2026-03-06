import { UrlTree } from '@angular/router';

export type SidenavRoute =
    | {
          type: 'menu';
          name: string;
          show?: boolean;
          children: Array<ChildRoute>;
          icon?: string;
          url?: string;
          path?: string;
          exact?: boolean;
      }
    | {
          type: 'button';
          name: string;
          path: string | any[] | UrlTree | null | undefined;
          show?: boolean;
          icon?: string;
          url?: string;
          children?: never;
          exact?: boolean;
      };

type LinkChild = {
    path: string;
    onClick?: never;
};

type ActionChild = {
    path?: never;
    onClick: () => void;
};

export type ChildRoute = {
    name: string;
    icon: string;
    url?: string;
} & (LinkChild | ActionChild);
