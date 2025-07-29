import { AccessControlManager, Permission, ResourceType, createUserContext, requiresPermission, isResourceOwner, canAccessResource } from '../access-control.js';
import { BusinessRuleError } from '../../errors/custom-errors.js';
describe('Access Control', () => {
    let acm;
    beforeEach(() => {
        acm = new AccessControlManager();
    });
    describe('UserContext', () => {
        it('should create anonymous user context by default', () => {
            const context = createUserContext();
            expect(context.roles).toEqual(['anonymous']);
            expect(context.userId).toBeUndefined();
        });
        it('should create user context with provided options', () => {
            const context = createUserContext({
                userId: 'user123',
                roles: ['user', 'admin'],
                attributes: { department: 'IT' },
                ip: '127.0.0.1'
            });
            expect(context.userId).toBe('user123');
            expect(context.roles).toEqual(['user', 'admin']);
            expect(context.attributes?.department).toBe('IT');
            expect(context.ip).toBe('127.0.0.1');
        });
    });
    describe('Permission checking', () => {
        it('should grant permission to admin for any action', () => {
            const user = {
                userId: 'admin123',
                roles: ['admin']
            };
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.CREATE)).not.toThrow();
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.DELETE)).not.toThrow();
        });
        it('should grant basic permissions to users', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            // Users can read and create
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.READ)).not.toThrow();
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.CREATE)).not.toThrow();
            // But not delete (unless owner)
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.DELETE)).toThrow(BusinessRuleError);
        });
        it('should deny most permissions to anonymous users', () => {
            const user = {
                roles: ['anonymous']
            };
            // Anonymous can only read
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.READ)).not.toThrow();
            // Cannot create, update, or delete
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.CREATE)).toThrow(BusinessRuleError);
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.UPDATE)).toThrow(BusinessRuleError);
        });
        it('should check multiple roles', () => {
            const user = {
                userId: 'user123',
                roles: ['anonymous', 'user'] // Has both roles
            };
            // Should use highest permission level (user)
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.CREATE)).not.toThrow();
        });
        it('should handle custom resource types', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            // User role has READ permission inherited from anonymous
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.READ)).not.toThrow();
            // User role has CREATE permission
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.CREATE)).not.toThrow();
        });
    });
    describe('Resource ownership', () => {
        it('should identify resource owner correctly', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            const resource = {
                id: '1',
                createdBy: 'user123',
                title: 'My Resource'
            };
            expect(isResourceOwner(user, resource)).toBe(true);
        });
        it('should return false for non-owners', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            const resource = {
                id: '1',
                createdBy: 'user456',
                title: 'Someone else\'s resource'
            };
            expect(isResourceOwner(user, resource)).toBe(false);
        });
        it('should handle missing userId or createdBy', () => {
            const userNoId = {
                roles: ['user']
            };
            const resource = {
                id: '1',
                createdBy: 'user123'
            };
            expect(isResourceOwner(userNoId, resource)).toBe(false);
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            const resourceNoCreator = {
                id: '1',
                title: 'No creator'
            };
            expect(isResourceOwner(user, resourceNoCreator)).toBe(false);
        });
        it('should handle null/undefined resources', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            expect(isResourceOwner(user, null)).toBe(false);
            expect(isResourceOwner(user, undefined)).toBe(false);
        });
    });
    describe('Ownership-based permissions', () => {
        it('should check ownership with canAccessResource', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            const ownResource = {
                id: '1',
                createdBy: 'user123',
                title: 'My Resource'
            };
            const otherResource = {
                id: '2',
                createdBy: 'user456',
                title: 'Someone else\'s resource'
            };
            // Owner can update/delete their own resources
            expect(canAccessResource(user, ownResource, ResourceType.ISSUE, Permission.UPDATE, acm)).toBe(true);
            expect(canAccessResource(user, ownResource, ResourceType.ISSUE, Permission.DELETE, acm)).toBe(true);
            // Non-owner cannot delete others' resources (users don't have delete permission)
            expect(canAccessResource(user, otherResource, ResourceType.ISSUE, Permission.DELETE, acm)).toBe(false);
            // But can update (users have update permission)
            expect(canAccessResource(user, otherResource, ResourceType.ISSUE, Permission.UPDATE, acm)).toBe(true);
        });
        it('should allow admins to access any resource', () => {
            const admin = {
                userId: 'admin123',
                roles: ['admin']
            };
            const resource = {
                id: '1',
                createdBy: 'user456', // Not the admin
                title: 'Someone else\'s resource'
            };
            // Admin can do anything
            expect(canAccessResource(admin, resource, ResourceType.ISSUE, Permission.DELETE, acm)).toBe(true);
            expect(canAccessResource(admin, resource, ResourceType.ISSUE, Permission.UPDATE, acm)).toBe(true);
        });
    });
    describe('Decorator usage', () => {
        it('should work as a decorator', async () => {
            const mockHandler = jest.fn().mockResolvedValue({ result: 'success' });
            const protectedHandler = requiresPermission(ResourceType.ISSUE, Permission.CREATE)(mockHandler);
            const adminContext = {
                user: createUserContext({ userId: 'admin123', roles: ['admin'] })
            };
            await protectedHandler({}, adminContext);
            expect(mockHandler).toHaveBeenCalled();
        });
        it('should block unauthorized access via decorator', async () => {
            const mockHandler = jest.fn().mockResolvedValue({ result: 'success' });
            const protectedHandler = requiresPermission(ResourceType.ISSUE, Permission.DELETE)(mockHandler);
            const anonContext = {
                user: createUserContext({ roles: ['anonymous'] })
            };
            await expect(protectedHandler({}, anonContext)).rejects.toThrow(BusinessRuleError);
            expect(mockHandler).not.toHaveBeenCalled();
        });
        it('should create user context if missing', async () => {
            const mockHandler = jest.fn().mockResolvedValue({ result: 'success' });
            const protectedHandler = requiresPermission(ResourceType.ISSUE, Permission.READ)(mockHandler);
            // No user context provided
            await protectedHandler({}, {});
            expect(mockHandler).toHaveBeenCalled();
        });
    });
    describe('Permission combinations', () => {
        it('should handle multiple resource types', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            // Check different resource types
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, Permission.CREATE)).not.toThrow();
            expect(() => acm.requirePermission(user, ResourceType.PLAN, Permission.CREATE)).not.toThrow();
            expect(() => acm.requirePermission(user, ResourceType.DOCUMENT, Permission.READ)).not.toThrow();
        });
        it('should validate permission values', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            // Invalid permission should not throw (just deny access)
            expect(() => acm.requirePermission(user, ResourceType.ISSUE, 'INVALID')).toThrow(BusinessRuleError);
        });
    });
    describe('Error messages', () => {
        it('should provide clear error messages', () => {
            const user = {
                userId: 'user123',
                roles: ['user']
            };
            try {
                acm.requirePermission(user, ResourceType.ISSUE, Permission.DELETE);
                fail('Should have thrown');
            }
            catch (error) {
                expect(error.message).toContain('Access denied');
                expect(error.message).toContain('delete');
                expect(error.message).toContain('issue');
            }
        });
    });
});
//# sourceMappingURL=access-control.test.js.map