/**
 * @ai-context Access control and permission management
 * @ai-pattern Role-based access control (RBAC)
 * @ai-critical Enforces authorization policies
 * @ai-why Prevents unauthorized access to resources
 */
import { createLogger } from '../utils/logger.js';
import { BusinessRuleError } from '../errors/custom-errors.js';
const logger = createLogger('AccessControl');
/**
 * @ai-intent Permission types
 * @ai-pattern CRUD + custom permissions
 */
export var Permission;
(function (Permission) {
    // Basic CRUD
    Permission["CREATE"] = "create";
    Permission["READ"] = "read";
    Permission["UPDATE"] = "update";
    Permission["DELETE"] = "delete";
    // Advanced
    Permission["SEARCH"] = "search";
    Permission["EXPORT"] = "export";
    Permission["IMPORT"] = "import";
    Permission["ADMIN"] = "admin";
    // Resource-specific
    Permission["MANAGE_TAGS"] = "manage_tags";
    Permission["MANAGE_STATUS"] = "manage_status";
    Permission["MANAGE_TYPES"] = "manage_types";
})(Permission || (Permission = {}));
/**
 * @ai-intent Resource types
 * @ai-pattern Resources that can be protected
 */
export var ResourceType;
(function (ResourceType) {
    ResourceType["ISSUE"] = "issue";
    ResourceType["PLAN"] = "plan";
    ResourceType["DOCUMENT"] = "document";
    ResourceType["KNOWLEDGE"] = "knowledge";
    ResourceType["SESSION"] = "session";
    ResourceType["SUMMARY"] = "summary";
    ResourceType["TAG"] = "tag";
    ResourceType["STATUS"] = "status";
    ResourceType["TYPE"] = "type";
    ResourceType["SYSTEM"] = "system";
})(ResourceType || (ResourceType = {}));
/**
 * @ai-intent Default role definitions
 * @ai-pattern Common roles with standard permissions
 */
export const DEFAULT_ROLES = {
    anonymous: {
        name: 'anonymous',
        permissions: new Set([
            'issue:read',
            'plan:read',
            'document:read',
            'knowledge:read',
            'tag:read',
            'status:read'
        ])
    },
    user: {
        name: 'user',
        permissions: new Set([
            'issue:create',
            'issue:update',
            'plan:create',
            'plan:update',
            'document:create',
            'document:update',
            'knowledge:create',
            'knowledge:update',
            'session:create',
            'session:update',
            'summary:create',
            'summary:update',
            'search'
        ]),
        inherits: ['anonymous']
    },
    moderator: {
        name: 'moderator',
        permissions: new Set([
            'issue:delete',
            'plan:delete',
            'document:delete',
            'knowledge:delete',
            'tag:manage_tags',
            'status:manage_status'
        ]),
        inherits: ['user']
    },
    admin: {
        name: 'admin',
        permissions: new Set([
            'system:admin',
            'type:manage_types',
            'export',
            'import'
        ]),
        inherits: ['moderator']
    }
};
/**
 * @ai-intent Access control manager
 * @ai-pattern Central authorization service
 * @ai-critical All access decisions go through here
 */
export class AccessControlManager {
    roles;
    roleCache = new Map();
    constructor(roles = DEFAULT_ROLES) {
        this.roles = new Map(Object.entries(roles));
        this.buildRoleCache();
    }
    /**
     * @ai-intent Build permission cache for roles
     * @ai-pattern Resolve role inheritance
     * @ai-side-effects Populates roleCache
     */
    buildRoleCache() {
        for (const [roleName, role] of this.roles.entries()) {
            const permissions = this.resolvePermissions(role);
            this.roleCache.set(roleName, permissions);
        }
    }
    /**
     * @ai-intent Resolve all permissions for a role
     * @ai-pattern Recursive inheritance resolution
     * @ai-return Complete permission set
     */
    resolvePermissions(role, visited = new Set()) {
        // Prevent circular inheritance
        if (visited.has(role.name)) {
            logger.warn('Circular role inheritance detected', { role: role.name });
            return new Set();
        }
        visited.add(role.name);
        const permissions = new Set(role.permissions);
        // Inherit permissions
        if (role.inherits) {
            for (const parentName of role.inherits) {
                const parent = this.roles.get(parentName);
                if (parent) {
                    const parentPerms = this.resolvePermissions(parent, visited);
                    parentPerms.forEach(perm => permissions.add(perm));
                }
            }
        }
        return permissions;
    }
    /**
     * @ai-intent Check if user has permission
     * @ai-flow 1. Get user permissions -> 2. Check specific permission -> 3. Check wildcards
     * @ai-return true if permitted, false otherwise
     */
    hasPermission(user, resource, permission, _resourceData) {
        const requiredPerm = `${resource}:${permission}`;
        // Check each user role
        for (const roleName of user.roles) {
            const rolePerms = this.roleCache.get(roleName);
            if (!rolePerms) {
                logger.warn('Unknown role', { role: roleName });
                continue;
            }
            // Direct permission check
            if (rolePerms.has(requiredPerm)) {
                return true;
            }
            // Wildcard resource check (e.g., "*:read")
            if (rolePerms.has(`*:${permission}`)) {
                return true;
            }
            // Wildcard permission check (e.g., "issue:*")
            if (rolePerms.has(`${resource}:*`)) {
                return true;
            }
            // Admin override
            if (rolePerms.has('system:admin')) {
                return true;
            }
        }
        return false;
    }
    /**
     * @ai-intent Enforce permission requirement
     * @ai-throws BusinessRuleError if not permitted
     */
    requirePermission(user, resource, permission, resourceData) {
        if (!this.hasPermission(user, resource, permission, resourceData)) {
            logger.warn('Access denied', {
                user: user.userId,
                resource,
                permission,
                roles: user.roles
            });
            throw new BusinessRuleError(`Access denied: ${permission} permission required for ${resource}`, 'ACCESS_DENIED', { resource, permission });
        }
    }
    /**
     * @ai-intent Check multiple permissions (ANY)
     * @ai-pattern User needs at least one permission
     * @ai-return true if any permission granted
     */
    hasAnyPermission(user, permissions) {
        return permissions.some(({ resource, permission }) => this.hasPermission(user, resource, permission));
    }
    /**
     * @ai-intent Check multiple permissions (ALL)
     * @ai-pattern User needs all permissions
     * @ai-return true if all permissions granted
     */
    hasAllPermissions(user, permissions) {
        return permissions.every(({ resource, permission }) => this.hasPermission(user, resource, permission));
    }
    /**
     * @ai-intent Filter resources by permission
     * @ai-pattern Remove unauthorized resources from list
     * @ai-usage For search results filtering
     */
    filterByPermission(user, resources, permission) {
        return resources.filter(resource => {
            const resourceType = resource.type;
            return this.hasPermission(user, resourceType, permission, resource);
        });
    }
    /**
     * @ai-intent Get effective permissions for user
     * @ai-usage For UI permission display
     * @ai-return Set of permission strings
     */
    getEffectivePermissions(user) {
        const permissions = new Set();
        for (const roleName of user.roles) {
            const rolePerms = this.roleCache.get(roleName);
            if (rolePerms) {
                rolePerms.forEach(perm => permissions.add(perm));
            }
        }
        return permissions;
    }
    /**
     * @ai-intent Add custom role
     * @ai-usage For dynamic role creation
     */
    addRole(role) {
        this.roles.set(role.name, role);
        this.buildRoleCache();
    }
    /**
     * @ai-intent Remove role
     * @ai-usage For role management
     */
    removeRole(roleName) {
        this.roles.delete(roleName);
        this.buildRoleCache();
    }
}
/**
 * @ai-intent Create default user context
 * @ai-pattern For anonymous or system users
 */
export function createUserContext(options = {}) {
    return {
        userId: options.userId,
        roles: options.roles || ['anonymous'],
        attributes: options.attributes || {},
        ip: options.ip,
        sessionId: options.sessionId
    };
}
/**
 * @ai-intent Access control middleware factory
 * @ai-pattern Wraps handlers with permission checks
 */
export function requiresPermission(resource, permission) {
    return (handler) => {
        return async (params, context) => {
            const userContext = context?.user || createUserContext();
            // Check permission
            const acm = new AccessControlManager();
            acm.requirePermission(userContext, resource, permission);
            // Execute handler
            return handler(params, context);
        };
    };
}
/**
 * @ai-intent Resource owner check
 * @ai-pattern Allow users to modify their own resources
 */
export function isResourceOwner(user, resource) {
    if (!user.userId || !resource.createdBy) {
        return false;
    }
    return user.userId === resource.createdBy;
}
/**
 * @ai-intent Combine with ownership check
 * @ai-pattern Permission OR ownership
 */
export function canAccessResource(user, resource, resourceType, permission, acm) {
    // Check permission
    if (acm.hasPermission(user, resourceType, permission, resource)) {
        return true;
    }
    // Check ownership for update/delete
    if ((permission === Permission.UPDATE || permission === Permission.DELETE) &&
        isResourceOwner(user, resource)) {
        return true;
    }
    return false;
}
//# sourceMappingURL=access-control.js.map