import type { ActiveCosmoRole, CosmoRole, Permission } from "../types/permissions";
import {
  DEFAULT_ROUTE_BY_ROLE,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  type AppRoute,
} from "../types/permissions";

class PermissionEngineImpl {
  hasPermission(role: CosmoRole | null | undefined, permission: Permission): boolean {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  }

  hasAnyPermission(
    role: CosmoRole | null | undefined,
    permissions: Permission[]
  ): boolean {
    return permissions.some((permission) => this.hasPermission(role, permission));
  }

  canAccessRoute(
    role: ActiveCosmoRole | null | undefined,
    path: AppRoute
  ): boolean {
    if (!role) return false;
    return ROUTE_PERMISSIONS[path]?.includes(role) ?? false;
  }

  getDefaultRoute(role: ActiveCosmoRole | null | undefined): string {
    if (!role) return "/login";
    return DEFAULT_ROUTE_BY_ROLE[role];
  }

  getRoleLabel(role: CosmoRole): string {
    return ROLE_LABELS[role];
  }

  getPermissions(role: CosmoRole): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
  }

  isActiveRole(role: string): role is ActiveCosmoRole {
    return (
      role === "admin" ||
      role === "manager" ||
      role === "cashier" ||
      role === "kitchen"
    );
  }
}

export const permissionEngine = new PermissionEngineImpl();

export type { AppRoute, CosmoRole, Permission, ActiveCosmoRole };
