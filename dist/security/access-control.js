import { createLogger } from '../utils/logger.js';
import { BusinessRuleError } from '../errors/custom-errors.js';
const logger = createLogger('AccessControl');
export var Permission;
(function (Permission) {
    Permission["CREATE"] = "create";
    Permission["READ"] = "read";
    Permission["UPDATE"] = "update";
    Permission["DELETE"] = "delete";
    Permission["SEARCH"] = "search";
    Permission["EXPORT"] = "export";
    Permission["IMPORT"] = "import";
    Permission["ADMIN"] = "admin";
    Permission["MANAGE_TAGS"] = "manage_tags";
    Permission["MANAGE_STATUS"] = "manage_status";
    Permission["MANAGE_TYPES"] = "manage_types";
})(Permission || (Permission = {}));
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
export class AccessControlManager {
    roles;
    roleCache = new Map();
    constructor(roles = DEFAULT_ROLES) {
        this.roles = new Map(Object.entries(roles));
        this.buildRoleCache();
    }
    buildRoleCache() {
        for (const [roleName, role] of this.roles.entries()) {
            const permissions = this.resolvePermissions(role);
            this.roleCache.set(roleName, permissions);
        }
    }
    resolvePermissions(role, visited = new Set()) {
        if (visited.has(role.name)) {
            logger.warn('Circular role inheritance detected', { role: role.name });
            return new Set();
        }
        visited.add(role.name);
        const permissions = new Set(role.permissions);
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
    hasPermission(user, resource, permission, _resourceData) {
        const requiredPerm = `${resource}:${permission}`;
        for (const roleName of user.roles) {
            const rolePerms = this.roleCache.get(roleName);
            if (!rolePerms) {
                logger.warn('Unknown role', { role: roleName });
                continue;
            }
            if (rolePerms.has(requiredPerm)) {
                return true;
            }
            if (rolePerms.has(`*:${permission}`)) {
                return true;
            }
            if (rolePerms.has(`${resource}:*`)) {
                return true;
            }
            if (rolePerms.has('system:admin')) {
                return true;
            }
        }
        return false;
    }
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
    hasAnyPermission(user, permissions) {
        return permissions.some(({ resource, permission }) => this.hasPermission(user, resource, permission));
    }
    hasAllPermissions(user, permissions) {
        return permissions.every(({ resource, permission }) => this.hasPermission(user, resource, permission));
    }
    filterByPermission(user, resources, permission) {
        return resources.filter(resource => {
            const resourceType = resource.type;
            return this.hasPermission(user, resourceType, permission, resource);
        });
    }
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
    addRole(role) {
        this.roles.set(role.name, role);
        this.buildRoleCache();
    }
    removeRole(roleName) {
        this.roles.delete(roleName);
        this.buildRoleCache();
    }
}
export function createUserContext(options = {}) {
    return {
        userId: options.userId,
        roles: options.roles || ['anonymous'],
        attributes: options.attributes || {},
        ip: options.ip,
        sessionId: options.sessionId
    };
}
export function requiresPermission(resource, permission) {
    return (handler) => {
        return async (params, context) => {
            const userContext = context?.user || createUserContext();
            const acm = new AccessControlManager();
            acm.requirePermission(userContext, resource, permission);
            return handler(params, context);
        };
    };
}
export function isResourceOwner(user, resource) {
    const res = resource;
    if (!user.userId || !res?.createdBy) {
        return false;
    }
    return user.userId === res.createdBy;
}
export function canAccessResource(user, resource, resourceType, permission, acm) {
    if (acm.hasPermission(user, resourceType, permission, resource)) {
        return true;
    }
    if ((permission === Permission.UPDATE || permission === Permission.DELETE) &&
        isResourceOwner(user, resource)) {
        return true;
    }
    return false;
}
