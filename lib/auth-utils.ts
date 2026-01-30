import { auth } from "./auth";
import type { UserRole } from "./types";

/**
 * Get current authenticated user session
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Get current user session or throw error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Check if user is Admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Check if user is Manager or Admin
 */
export function isManagerOrAdmin(userRole: UserRole): boolean {
  return userRole === "manager" || userRole === "admin";
}

/**
 * Check if user is Agent, Manager, or Admin
 */
export function isAgentOrAbove(userRole: UserRole): boolean {
  return userRole === "agent" || userRole === "manager" || userRole === "admin";
}

/**
 * Require user to have specific role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!hasRole(user.role, allowedRoles)) {
    throw new Error("Forbidden");
  }
  return user;
}

/**
 * Require user to be Admin
 */
export async function requireAdmin() {
  return requireRole(["admin"]);
}

/**
 * Require user to be Manager or Admin
 */
export async function requireManagerOrAdmin() {
  return requireRole(["manager", "admin"]);
}

/**
 * Require user to be Agent or above
 */
export async function requireAgentOrAbove() {
  return requireRole(["agent", "manager", "admin"]);
}
