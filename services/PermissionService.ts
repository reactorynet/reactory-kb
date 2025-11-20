/**
 * Permission Service
 * 
 * Manages permissions and access control for knowledge base content.
 * Handles role-based access control (RBAC) and content visibility.
 */

import Reactory from '@reactory/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { Content } from '@reactory/server-modules/reactory-core/models';
import logger from '@reactory/server-core/logging';
import {
  IKBContent,
  KBContentType,
  KBVisibility,
  KBPermissionLevel,
  IPermissionGrant,
  IPermissionCheckResult,
  IVisibilitySettings,
} from '../types';

/**
 * Permission Service Interface
 */
export interface IPermissionService extends Reactory.Service.IReactoryService {
  /**
   * Check if user has permission
   */
  checkPermission(
    contentId: string,
    userId: string,
    requiredPermission: KBPermissionLevel
  ): Promise<IPermissionCheckResult>;

  /**
   * Grant permission to a user
   */
  grantPermission(
    contentId: string,
    userId: string,
    permission: KBPermissionLevel
  ): Promise<IPermissionGrant>;

  /**
   * Revoke permission from a user
   */
  revokePermission(contentId: string, userId: string): Promise<boolean>;

  /**
   * Get permissions for content
   */
  getContentPermissions(contentId: string): Promise<IPermissionGrant[]>;

  /**
   * Get user's permissions
   */
  getUserPermissions(userId: string): Promise<IPermissionGrant[]>;

  /**
   * Check visibility access
   */
  checkVisibilityAccess(content: IKBContent, userId?: string): Promise<boolean>;

  /**
   * Update content visibility
   */
  updateVisibility(contentId: string, visibility: KBVisibility): Promise<IKBContent>;

  /**
   * Get effective permission level
   */
  getEffectivePermission(contentId: string, userId: string): Promise<KBPermissionLevel | null>;
}

/**
 * Permission Service Implementation
 */
class PermissionService implements IPermissionService {
  name: string = 'PermissionService';
  nameSpace: string = 'kb';
  version: string = '1.0.0';

  props: Reactory.Service.IReactoryServiceProps;
  context: Reactory.Server.IReactoryContext;

  // In-memory cache for permissions (in production, use Redis)
  private permissionCache: Map<string, IPermissionGrant[]> = new Map();

  constructor(
    props: Reactory.Service.IReactoryServiceProps,
    context: Reactory.Server.IReactoryContext
  ) {
    this.props = props;
    this.context = context;
  }

  /**
   * Get cache key for content permissions
   */
  private getCacheKey(contentId: string): string {
    return `kb:permissions:${contentId}`;
  }

  /**
   * Clear permission cache for content
   */
  private clearCache(contentId: string): void {
    this.permissionCache.delete(this.getCacheKey(contentId));
  }

  /**
   * Compare permission levels
   */
  private isPermissionSufficient(
    userPermission: KBPermissionLevel,
    requiredPermission: KBPermissionLevel
  ): boolean {
    const hierarchy: KBPermissionLevel[] = [
      KBPermissionLevel.READER,
      KBPermissionLevel.WRITER,
      KBPermissionLevel.ADMIN,
      KBPermissionLevel.OWNER,
    ];

    const userLevel = hierarchy.indexOf(userPermission);
    const requiredLevel = hierarchy.indexOf(requiredPermission);

    return userLevel >= requiredLevel;
  }

  /**
   * Check if user has permission
   */
  @roles(['USER', 'ANON'])
  async checkPermission(
    contentId: string,
    userId: string,
    requiredPermission: KBPermissionLevel
  ): Promise<IPermissionCheckResult> {
    try {
      // Get content
      const content = await Content.findById(contentId);

      if (!content) {
        return {
          hasPermission: false,
          reason: 'Content not found',
        };
      }

      // Owner always has full access
      if (content.createdBy && content.createdBy.toString() === userId) {
        return {
          hasPermission: true,
          effectivePermission: KBPermissionLevel.OWNER,
        };
      }

      // Check visibility first
      const visibility = (content as any).visibility || KBVisibility.PRIVATE;

      if (visibility === KBVisibility.PUBLIC) {
        // Public content: everyone can read
        if (requiredPermission === KBPermissionLevel.READER) {
          return {
            hasPermission: true,
            effectivePermission: KBPermissionLevel.READER,
          };
        }
      }

      // Check explicit permissions
      const effectivePermission = await this.getEffectivePermission(contentId, userId);

      if (effectivePermission) {
        const hasPermission = this.isPermissionSufficient(effectivePermission, requiredPermission);
        return {
          hasPermission,
          effectivePermission,
          reason: hasPermission ? undefined : 'Insufficient permissions',
        };
      }

      // Check organization-level access
      if (visibility === KBVisibility.ORGANIZATION) {
        const user = await this.context.services.core.UserService.findById(userId);
        if (user && user.organization && content.organization) {
          if (user.organization.toString() === content.organization.toString()) {
            return {
              hasPermission: requiredPermission === KBPermissionLevel.READER,
              effectivePermission: KBPermissionLevel.READER,
            };
          }
        }
      }

      // No permission
      return {
        hasPermission: false,
        reason: 'Access denied',
      };
    } catch (error) {
      logger.error('Error checking permission:', error);
      return {
        hasPermission: false,
        reason: 'Error checking permissions',
      };
    }
  }

  /**
   * Grant permission to a user
   */
  @roles(['USER', 'ADMIN'])
  async grantPermission(
    contentId: string,
    userId: string,
    permission: KBPermissionLevel
  ): Promise<IPermissionGrant> {
    try {
      logger.debug(`Granting ${permission} permission to user ${userId} for content ${contentId}`);

      // Verify content exists
      const content = await Content.findById(contentId);

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      // Check if current user has permission to grant
      const isOwner = content.createdBy && content.createdBy.toString() === this.context.user._id.toString();
      const isAdmin = this.context.user.roles?.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        throw new Error('Access denied: Only owners and admins can grant permissions');
      }

      // TODO: Store permissions in a dedicated collection
      // For now, store in content metadata
      const permissions = (content as any).permissions || [];
      
      // Remove existing permission for this user
      const filteredPermissions = permissions.filter(
        (p: any) => p.userId !== userId
      );

      // Add new permission
      const grant: IPermissionGrant = {
        id: `${contentId}-${userId}-${Date.now()}`,
        contentId,
        userId,
        permission,
        grantedBy: this.context.user._id.toString(),
        grantedAt: new Date(),
      };

      filteredPermissions.push(grant);
      (content as any).permissions = filteredPermissions;

      await content.save();

      // Clear cache
      this.clearCache(contentId);

      logger.info(`Permission granted: ${permission} to user ${userId} for content ${contentId}`);
      return grant;
    } catch (error) {
      logger.error('Error granting permission:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from a user
   */
  @roles(['USER', 'ADMIN'])
  async revokePermission(contentId: string, userId: string): Promise<boolean> {
    try {
      logger.debug(`Revoking permission from user ${userId} for content ${contentId}`);

      // Verify content exists
      const content = await Content.findById(contentId);

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      // Check if current user has permission to revoke
      const isOwner = content.createdBy && content.createdBy.toString() === this.context.user._id.toString();
      const isAdmin = this.context.user.roles?.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        throw new Error('Access denied: Only owners and admins can revoke permissions');
      }

      // Remove permission from content metadata
      const permissions = (content as any).permissions || [];
      const filteredPermissions = permissions.filter(
        (p: any) => p.userId !== userId
      );

      (content as any).permissions = filteredPermissions;
      await content.save();

      // Clear cache
      this.clearCache(contentId);

      logger.info(`Permission revoked from user ${userId} for content ${contentId}`);
      return true;
    } catch (error) {
      logger.error('Error revoking permission:', error);
      throw error;
    }
  }

  /**
   * Get permissions for content
   */
  @roles(['USER'])
  async getContentPermissions(contentId: string): Promise<IPermissionGrant[]> {
    try {
      // Check cache
      const cacheKey = this.getCacheKey(contentId);
      if (this.permissionCache.has(cacheKey)) {
        return this.permissionCache.get(cacheKey)!;
      }

      // Verify content exists and user has access
      const content = await Content.findById(contentId);

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      // Only owner and admins can view all permissions
      const isOwner = content.createdBy && content.createdBy.toString() === this.context.user._id.toString();
      const isAdmin = this.context.user.roles?.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        throw new Error('Access denied: Only owners and admins can view permissions');
      }

      // Get permissions from content metadata
      const permissions = (content as any).permissions || [];

      // Cache the result
      this.permissionCache.set(cacheKey, permissions);

      return permissions;
    } catch (error) {
      logger.error('Error getting content permissions:', error);
      throw error;
    }
  }

  /**
   * Get user's permissions
   */
  @roles(['USER'])
  async getUserPermissions(userId: string): Promise<IPermissionGrant[]> {
    try {
      // Users can only view their own permissions unless admin
      if (userId !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You can only view your own permissions');
        }
      }

      // TODO: Query permissions collection when implemented
      // For now, scan all content (inefficient, needs dedicated permission collection)
      logger.warn('getUserPermissions not fully implemented - needs dedicated permission collection');
      return [];
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw error;
    }
  }

  /**
   * Check visibility access
   */
  @roles(['USER', 'ANON'])
  async checkVisibilityAccess(content: IKBContent, userId?: string): Promise<boolean> {
    try {
      const visibility = content.visibility || KBVisibility.PRIVATE;

      // Public content is accessible to everyone
      if (visibility === KBVisibility.PUBLIC) {
        return true;
      }

      // Anonymous users can only access public content
      if (!userId) {
        return false;
      }

      // Owner always has access
      if (content.createdBy && content.createdBy.toString() === userId) {
        return true;
      }

      // Check organization-level access
      if (visibility === KBVisibility.ORGANIZATION) {
        const user = await this.context.services.core.UserService.findById(userId);
        if (user && user.organization && content.organization) {
          return user.organization.toString() === content.organization.toString();
        }
      }

      // Check explicit permissions
      const effectivePermission = await this.getEffectivePermission(
        content.id?.toString() || '',
        userId
      );

      return effectivePermission !== null;
    } catch (error) {
      logger.error('Error checking visibility access:', error);
      return false;
    }
  }

  /**
   * Update content visibility
   */
  @roles(['USER', 'ADMIN'])
  async updateVisibility(contentId: string, visibility: KBVisibility): Promise<IKBContent> {
    try {
      logger.debug(`Updating visibility for content ${contentId} to ${visibility}`);

      const content = await Content.findById(contentId);

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      // Check if user has permission to update
      const isOwner = content.createdBy && content.createdBy.toString() === this.context.user._id.toString();
      const isAdmin = this.context.user.roles?.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        throw new Error('Access denied: Only owners and admins can update visibility');
      }

      (content as any).visibility = visibility;
      content.updatedAt = new Date();
      content.updatedBy = this.context.user._id;

      await content.save();

      logger.info(`Visibility updated for content ${contentId}: ${visibility}`);
      return content.toObject() as IKBContent;
    } catch (error) {
      logger.error('Error updating visibility:', error);
      throw error;
    }
  }

  /**
   * Get effective permission level
   */
  @roles(['USER', 'ANON'])
  async getEffectivePermission(
    contentId: string,
    userId: string
  ): Promise<KBPermissionLevel | null> {
    try {
      const content = await Content.findById(contentId);

      if (!content) {
        return null;
      }

      // Owner has full permissions
      if (content.createdBy && content.createdBy.toString() === userId) {
        return KBPermissionLevel.OWNER;
      }

      // Get explicit permissions from content metadata
      const permissions = (content as any).permissions || [];
      const userPermission = permissions.find((p: any) => p.userId === userId);

      if (userPermission) {
        return userPermission.permission;
      }

      // TODO: Check group/role permissions

      return null;
    } catch (error) {
      logger.error('Error getting effective permission:', error);
      return null;
    }
  }

  /**
   * Lifecycle methods
   */
  async onStartup(): Promise<void> {
    logger.info('PermissionService started');
  }

  getExecutionContext(): Reactory.Server.IReactoryContext {
    return this.context;
  }

  setExecutionContext(context: Reactory.Server.IReactoryContext): boolean {
    this.context = context;
    return true;
  }

  /**
   * Service definition
   */
  static reactory: Reactory.Service.IReactoryServiceDefinition<PermissionService> = {
    id: 'kb.PermissionService@1.0.0',
    nameSpace: 'kb',
    name: 'PermissionService',
    version: '1.0.0',
    description: 'Service for managing content permissions and access control',
    service: (
      props: Reactory.Service.IReactoryServiceProps,
      context: Reactory.Server.IReactoryContext
    ) => {
      return new PermissionService(props, context);
    },
    dependencies: [{ id: 'core.UserService@1.0.0', alias: 'userService' }],
    serviceType: 'authorization',
  };
}

export default PermissionService;
export { IPermissionService };

