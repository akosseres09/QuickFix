import { Permissions } from './Permissions';

export interface Claims {
    uid: string;
    role: { name: string; value: number };
    email: string;
}

export class UserClaims implements Claims {
    uid: string;
    role: { name: string; value: number };
    email: string;
    permissions: Permissions;

    constructor(
        uid: string,
        role: { name: string; value: number },
        email: string,
        permissions: Permissions
    ) {
        this.uid = uid;
        this.role = role;
        this.email = email;
        this.permissions = permissions;
    }

    private hasBasePermission(permission: string): boolean {
        return this.permissions.base.includes(permission);
    }

    private hasOrgPermission(orgId: string, permission: string): boolean {
        return this.permissions.org[orgId] && this.permissions.org[orgId].includes(permission);
    }

    private hasProjectPermission(projectId: string, permission: string): boolean {
        return (
            this.permissions.project[projectId] &&
            this.permissions.project[projectId].includes(permission)
        );
    }

    canDo(
        permission: string | string[],
        context?: { orgId?: string; projectId?: string }
    ): boolean {
        const permissions = Array.isArray(permission) ? permission : [permission];

        return permissions.every((p) => {
            if (this.hasBasePermission(p)) return true;
            if (context?.projectId && this.hasProjectPermission(context.projectId, p)) return true;
            if (context?.orgId && this.hasOrgPermission(context.orgId, p)) return true;
            return false;
        });
    }
}
