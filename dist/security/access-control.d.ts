/**
 * @ai-context Access control and permission management
 * @ai-pattern Role-based access control (RBAC)
 * @ai-critical Enforces authorization policies
 * @ai-why Prevents unauthorized access to resources
 */
/**
 * @ai-intent Permission types
 * @ai-pattern CRUD + custom permissions
 */
export declare enum Permission {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    SEARCH = "search",
    EXPORT = "export",
    IMPORT = "import",
    ADMIN = "admin",
    MANAGE_TAGS = "manage_tags",
    MANAGE_STATUS = "manage_status",
    MANAGE_TYPES = "manage_types"
}
/**
 * @ai-intent Resource types
 * @ai-pattern Resources that can be protected
 */
export declare enum ResourceType {
    ISSUE = "issue",
    PLAN = "plan",
    DOCUMENT = "document",
    KNOWLEDGE = "knowledge",
    SESSION = "session",
    SUMMARY = "summary",
    TAG = "tag",
    STATUS = "status",
    TYPE = "type",
    SYSTEM = "system"
}
/**
 * @ai-intent User role definition
 * @ai-pattern Hierarchical roles with inheritance
 */
export interface Role {
    name: string;
    permissions: Set<string>;
    inherits?: string[];
}
/**
 * @ai-intent User context for access control
 * @ai-pattern Contains user identity and attributes
 */
export interface UserContext {
    userId?: string;
    roles: string[];
    attributes?: Record<string, any>;
    ip?: string;
    sessionId?: string;
}
/**
 * @ai-intent Access control rule
 * @ai-pattern Fine-grained access control
 */
export interface AccessRule {
    resource: ResourceType;
    permission: Permission;
    condition?: (user: UserContext, resource?: any) => boolean;
}
/**
 * @ai-intent Default role definitions
 * @ai-pattern Common roles with standard permissions
 */
export declare const DEFAULT_ROLES: Record<string, Role>;
/**
 * @ai-intent Access control manager
 * @ai-pattern Central authorization service
 * @ai-critical All access decisions go through here
 */
export declare class AccessControlManager {
    private roles;
    private roleCache;
    constructor(roles?: Record<string, Role>);
    /**
     * @ai-intent Build permission cache for roles
     * @ai-pattern Resolve role inheritance
     * @ai-side-effects Populates roleCache
     */
    private buildRoleCache;
    /**
     * @ai-intent Resolve all permissions for a role
     * @ai-pattern Recursive inheritance resolution
     * @ai-return Complete permission set
     */
    private resolvePermissions;
    /**
     * @ai-intent Check if user has permission
     * @ai-flow 1. Get user permissions -> 2. Check specific permission -> 3. Check wildcards
     * @ai-return true if permitted, false otherwise
     */
    hasPermission(user: UserContext, resource: ResourceType, permission: Permission, resourceData?: any): boolean;
    /**
     * @ai-intent Enforce permission requirement
     * @ai-throws BusinessRuleError if not permitted
     */
    requirePermission(user: UserContext, resource: ResourceType, permission: Permission, resourceData?: any): void;
    /**
     * @ai-intent Check multiple permissions (ANY)
     * @ai-pattern User needs at least one permission
     * @ai-return true if any permission granted
     */
    hasAnyPermission(user: UserContext, permissions: Array<{
        resource: ResourceType;
        permission: Permission;
    }>): boolean;
    /**
     * @ai-intent Check multiple permissions (ALL)
     * @ai-pattern User needs all permissions
     * @ai-return true if all permissions granted
     */
    hasAllPermissions(user: UserContext, permissions: Array<{
        resource: ResourceType;
        permission: Permission;
    }>): boolean;
    /**
     * @ai-intent Filter resources by permission
     * @ai-pattern Remove unauthorized resources from list
     * @ai-usage For search results filtering
     */
    filterByPermission<T extends {
        type: string;
    }>(user: UserContext, resources: T[], permission: Permission): T[];
    /**
     * @ai-intent Get effective permissions for user
     * @ai-usage For UI permission display
     * @ai-return Set of permission strings
     */
    getEffectivePermissions(user: UserContext): Set<string>;
    /**
     * @ai-intent Add custom role
     * @ai-usage For dynamic role creation
     */
    addRole(role: Role): void;
    /**
     * @ai-intent Remove role
     * @ai-usage For role management
     */
    removeRole(roleName: string): void;
}
/**
 * @ai-intent Create default user context
 * @ai-pattern For anonymous or system users
 */
export declare function createUserContext(options?: Partial<UserContext>): UserContext;
/**
 * @ai-intent Access control middleware factory
 * @ai-pattern Wraps handlers with permission checks
 */
export declare function requiresPermission(resource: ResourceType, permission: Permission): (handler: Function) => (params: any, context?: any) => Promise<any>;
/**
 * @ai-intent Resource owner check
 * @ai-pattern Allow users to modify their own resources
 */
export declare function isResourceOwner(user: UserContext, resource: any): boolean;
/**
 * @ai-intent Combine with ownership check
 * @ai-pattern Permission OR ownership
 */
export declare function canAccessResource(user: UserContext, resource: any, resourceType: ResourceType, permission: Permission, acm: AccessControlManager): boolean;
