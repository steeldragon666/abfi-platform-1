import { createContext, useContext, ReactNode, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

// User roles in the system
export type UserRole = "supplier" | "buyer" | "admin" | "guest";

// Role-specific features and permissions
export interface RolePermissions {
  canCreateFeedstock: boolean;
  canRequestQuote: boolean;
  canViewSupplierDashboard: boolean;
  canViewBuyerDashboard: boolean;
  canManageFutures: boolean;
  canSubmitEOI: boolean;
  canAccessAdmin: boolean;
}

// Context value type
interface UserRoleContextValue {
  role: UserRole;
  permissions: RolePermissions;
  isSupplier: boolean;
  isBuyer: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  switchRole: (role: UserRole) => void;
  redirectToRoleDashboard: () => void;
}

// Default permissions by role
const rolePermissions: Record<UserRole, RolePermissions> = {
  supplier: {
    canCreateFeedstock: true,
    canRequestQuote: false,
    canViewSupplierDashboard: true,
    canViewBuyerDashboard: false,
    canManageFutures: true,
    canSubmitEOI: false,
    canAccessAdmin: false,
  },
  buyer: {
    canCreateFeedstock: false,
    canRequestQuote: true,
    canViewSupplierDashboard: false,
    canViewBuyerDashboard: true,
    canManageFutures: false,
    canSubmitEOI: true,
    canAccessAdmin: false,
  },
  admin: {
    canCreateFeedstock: true,
    canRequestQuote: true,
    canViewSupplierDashboard: true,
    canViewBuyerDashboard: true,
    canManageFutures: true,
    canSubmitEOI: true,
    canAccessAdmin: true,
  },
  guest: {
    canCreateFeedstock: false,
    canRequestQuote: false,
    canViewSupplierDashboard: false,
    canViewBuyerDashboard: false,
    canManageFutures: false,
    canSubmitEOI: false,
    canAccessAdmin: false,
  },
};

// Role-specific dashboard paths
const roleDashboards: Record<UserRole, string> = {
  supplier: "/grower/dashboard",
  buyer: "/developer/dashboard",
  admin: "/admin",
  guest: "/explore",
};

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Determine role from user data
  const role: UserRole = useMemo(() => {
    if (!user) return "guest";
    if (user.role === "admin") return "admin";
    if (user.role === "supplier") return "supplier";
    if (user.role === "buyer") return "buyer";
    return "guest";
  }, [user]);

  const permissions = rolePermissions[role];

  const switchRole = useCallback((newRole: UserRole) => {
    // In a real app, this would update the user's role in the backend
    console.log(`Switching role to: ${newRole}`);
    setLocation(roleDashboards[newRole]);
  }, [setLocation]);

  const redirectToRoleDashboard = useCallback(() => {
    setLocation(roleDashboards[role]);
  }, [role, setLocation]);

  const value: UserRoleContextValue = useMemo(() => ({
    role,
    permissions,
    isSupplier: role === "supplier",
    isBuyer: role === "buyer",
    isAdmin: role === "admin",
    isGuest: role === "guest",
    switchRole,
    redirectToRoleDashboard,
  }), [role, permissions, switchRole, redirectToRoleDashboard]);

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
}

// Role-based conditional rendering components
interface RoleGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SupplierOnly({ children, fallback = null }: RoleGuardProps) {
  const { isSupplier, isAdmin } = useUserRole();
  return (isSupplier || isAdmin) ? <>{children}</> : <>{fallback}</>;
}

export function BuyerOnly({ children, fallback = null }: RoleGuardProps) {
  const { isBuyer, isAdmin } = useUserRole();
  return (isBuyer || isAdmin) ? <>{children}</> : <>{fallback}</>;
}

export function AdminOnly({ children, fallback = null }: RoleGuardProps) {
  const { isAdmin } = useUserRole();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}

export function AuthenticatedOnly({ children, fallback = null }: RoleGuardProps) {
  const { isGuest } = useUserRole();
  return !isGuest ? <>{children}</> : <>{fallback}</>;
}

// Permission-based conditional rendering
interface PermissionGuardProps extends RoleGuardProps {
  permission: keyof RolePermissions;
}

export function RequirePermission({ permission, children, fallback = null }: PermissionGuardProps) {
  const { permissions } = useUserRole();
  return permissions[permission] ? <>{children}</> : <>{fallback}</>;
}
