import { UserRole } from '../../model/User';
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
        return false;
    }

    canDo(permission: string, context?: { orgId?: string; projectId?: string }): boolean {
        if (this.hasBasePermission(permission)) return true;

        if (context?.projectId && this.hasProjectPermission(context.projectId, permission))
            return true;
        if (context?.orgId && this.hasOrgPermission(context.orgId, permission)) return true;

        return false;
    }
}
