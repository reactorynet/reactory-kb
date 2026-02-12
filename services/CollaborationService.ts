/**
 * Collaboration Service
 * 
 * Manages collaborative features including comments, bookmarks, and activity tracking.
 */

import Reactory from '@reactory/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { Content } from '@reactory/server-modules/reactory-core/models';
import logger from '@reactory/server-core/logging';
import {
  IKBContent,
  IKBComment,
  IKBBookmark,
  IKBActivity,
  KBActivityAction,
  KBContentType,
} from '../types';
import { KBComment, KBBookmark } from '../models';

/**
 * Collaboration Service Interface
 */
export interface ICollaborationService extends Reactory.Service.IReactoryService {
  /**
   * Add a comment to content
   */
  addComment(contentId: string, content: string, parentId?: string): Promise<IKBComment>;

  /**
   * Update a comment
   */
  updateComment(commentId: string, content: string): Promise<IKBComment>;

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): Promise<boolean>;

  /**
   * Get comments for content
   */
  getComments(contentId: string, includeReplies?: boolean): Promise<IKBComment[]>;

  /**
   * Add a bookmark
   */
  addBookmark(contentId: string, note?: string, tags?: string[]): Promise<IKBBookmark>;

  /**
   * Remove a bookmark
   */
  removeBookmark(bookmarkId: string): Promise<boolean>;

  /**
   * Get user's bookmarks
   */
  getUserBookmarks(userId?: string): Promise<IKBBookmark[]>;

  /**
   * Get content activity
   */
  getContentActivity(contentId: string, limit?: number): Promise<IKBActivity[]>;

  /**
   * Update view count
   */
  updateViewCount(contentId: string): Promise<void>;

  /**
   * Like content
   */
  likeContent(contentId: string): Promise<void>;

  /**
   * Unlike content
   */
  unlikeContent(contentId: string): Promise<void>;

  /**
   * Log activity
   */
  logActivity(contentId: string, action: KBActivityAction, metadata?: any): Promise<void>;
}

/**
 * Collaboration Service Implementation
 */
class CollaborationService implements ICollaborationService {
  name: string = 'CollaborationService';
  nameSpace: string = 'kb';
  version: string = '1.0.0';

  props: Reactory.Service.IReactoryServiceProps;
  context: Reactory.Server.IReactoryContext;

  constructor(
    props: Reactory.Service.IReactoryServiceProps,
    context: Reactory.Server.IReactoryContext
  ) {
    this.props = props;
    this.context = context;
  }

  /**
   * Verify content exists and is accessible
   */
  private async verifyContentAccess(contentId: string): Promise<IKBContent> {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new Error(`Content ${contentId} not found`);
    }

    // Check if comments are allowed
    const allowComments = (content as any).allowComments !== false;
    if (!allowComments) {
      throw new Error('Comments are not allowed on this content');
    }

    return content.toObject() as IKBContent;
  }

  /**
   * Add a comment to content
   */
  @roles(['USER'])
  async addComment(contentId: string, content: string, parentId?: string): Promise<IKBComment> {
    try {
      logger.debug(`Adding comment to content ${contentId}`);

      // Verify content exists and comments are allowed
      await this.verifyContentAccess(contentId);

      // If parent comment specified, verify it exists
      if (parentId) {
        const parentComment = await KBComment.findById(parentId);
        if (!parentComment) {
          throw new Error(`Parent comment ${parentId} not found`);
        }
        if (parentComment.contentId !== contentId) {
          throw new Error('Parent comment does not belong to this content');
        }
      }

      // Create comment
      const comment = await KBComment.create({
        contentId,
        author: this.context.user._id,
        content,
        parent: parentId || null,
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // If this is a reply, add to parent's replies array
      if (parentId) {
        await KBComment.findByIdAndUpdate(parentId, {
          $push: { replies: comment._id },
        });
      }

      // Add comment ID to content's comments array
      await Content.findByIdAndUpdate(contentId, {
        $push: { comments: comment._id },
      });

      // Log activity
      await this.logActivity(contentId, KBActivityAction.COMMENTED);

      logger.info(`Comment added to content ${contentId}: ${comment._id}`);
      return comment.toObject();
    } catch (error) {
      logger.error(`Error adding comment to content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  @roles(['USER'])
  async updateComment(commentId: string, content: string): Promise<IKBComment> {
    try {
      logger.debug(`Updating comment ${commentId}`);

      const comment = await KBComment.findById(commentId);

      if (!comment) {
        throw new Error(`Comment ${commentId} not found`);
      }

      // Check if user is the author
      if (comment.author.toString() !== this.context.user._id.toString()) {
        throw new Error('Access denied: You can only update your own comments');
      }

      comment.content = content;
      comment.updatedAt = new Date();

      await comment.save();

      logger.info(`Comment updated: ${commentId}`);
      return comment.toObject();
    } catch (error) {
      logger.error(`Error updating comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  @roles(['USER', 'ADMIN'])
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      logger.debug(`Deleting comment ${commentId}`);

      const comment = await KBComment.findById(commentId);

      if (!comment) {
        throw new Error(`Comment ${commentId} not found`);
      }

      // Check if user is the author or admin
      const isAuthor = comment.author.toString() === this.context.user._id.toString();
      const isAdmin = this.context.user.roles?.includes('ADMIN');

      if (!isAuthor && !isAdmin) {
        throw new Error('Access denied: You can only delete your own comments');
      }

      // Delete all reply comments
      if (comment.replies && comment.replies.length > 0) {
        await KBComment.deleteMany({ _id: { $in: comment.replies } });
      }

      // Remove from parent's replies if this is a reply
      if (comment.parent) {
        await KBComment.findByIdAndUpdate(comment.parent, {
          $pull: { replies: comment._id },
        });
      }

      // Remove from content's comments array
      await Content.findByIdAndUpdate(comment.contentId, {
        $pull: { comments: comment._id },
      });

      // Delete the comment
      await comment.deleteOne();

      logger.info(`Comment deleted: ${commentId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Get comments for content
   */
  @roles(['USER', 'ANON'])
  async getComments(contentId: string, includeReplies: boolean = true): Promise<IKBComment[]> {
    try {
      // Verify content exists
      await Content.findById(contentId);

      const query: any = { contentId };

      // If not including replies, only get top-level comments
      if (!includeReplies) {
        query.parent = null;
      }

      const comments = await KBComment.find(query)
        .populate('author', 'firstName lastName email avatar')
        .populate({
          path: 'replies',
          populate: { path: 'author', select: 'firstName lastName email avatar' },
        })
        .sort({ createdAt: -1 })
        .lean();

      return comments;
    } catch (error) {
      logger.error(`Error getting comments for content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Add a bookmark
   */
  @roles(['USER'])
  async addBookmark(contentId: string, note?: string, tags?: string[]): Promise<IKBBookmark> {
    try {
      logger.debug(`Adding bookmark for content ${contentId}`);

      // Verify content exists
      await Content.findById(contentId);

      // Check if bookmark already exists
      const existing = await KBBookmark.findOne({
        userId: this.context.user._id,
        contentId,
      });

      if (existing) {
        throw new Error('Bookmark already exists for this content');
      }

      // Create bookmark
      const bookmark = await KBBookmark.create({
        userId: this.context.user._id,
        contentId,
        note: note || '',
        tags: tags || [],
        createdAt: new Date(),
      });

      // Add bookmark ID to content's bookmarks array
      await Content.findByIdAndUpdate(contentId, {
        $push: { bookmarks: bookmark._id },
      });

      // Log activity
      await this.logActivity(contentId, KBActivityAction.BOOKMARKED);

      logger.info(`Bookmark added for content ${contentId}: ${bookmark._id}`);
      return bookmark.toObject();
    } catch (error) {
      logger.error(`Error adding bookmark for content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a bookmark
   */
  @roles(['USER'])
  async removeBookmark(bookmarkId: string): Promise<boolean> {
    try {
      logger.debug(`Removing bookmark ${bookmarkId}`);

      const bookmark = await KBBookmark.findById(bookmarkId);

      if (!bookmark) {
        throw new Error(`Bookmark ${bookmarkId} not found`);
      }

      // Check if user owns the bookmark
      if (bookmark.userId.toString() !== this.context.user._id.toString()) {
        throw new Error('Access denied: You can only remove your own bookmarks');
      }

      // Remove from content's bookmarks array
      await Content.findByIdAndUpdate(bookmark.contentId, {
        $pull: { bookmarks: bookmark._id },
      });

      // Delete the bookmark
      await bookmark.deleteOne();

      logger.info(`Bookmark removed: ${bookmarkId}`);
      return true;
    } catch (error) {
      logger.error(`Error removing bookmark ${bookmarkId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's bookmarks
   */
  @roles(['USER'])
  async getUserBookmarks(userId?: string): Promise<IKBBookmark[]> {
    try {
      const targetUserId = userId || this.context.user._id.toString();

      // Users can only see their own bookmarks
      if (targetUserId !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You can only view your own bookmarks');
        }
      }

      const bookmarks = await KBBookmark.find({ userId: targetUserId })
        .populate('contentId', 'title slug contentType')
        .sort({ createdAt: -1 })
        .lean();

      return bookmarks;
    } catch (error) {
      logger.error('Error getting user bookmarks:', error);
      throw error;
    }
  }

  /**
   * Get content activity
   */
  @roles(['USER'])
  async getContentActivity(contentId: string, limit: number = 50): Promise<IKBActivity[]> {
    try {
      // Verify content exists
      await Content.findById(contentId);

      // TODO: Implement activity tracking with a dedicated collection
      // For now, return empty array
      logger.warn('Activity tracking not yet implemented');
      return [];
    } catch (error) {
      logger.error(`Error getting content activity for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Update view count
   */
  @roles(['USER', 'ANON'])
  async updateViewCount(contentId: string): Promise<void> {
    try {
      await Content.findByIdAndUpdate(contentId, {
        $inc: { viewCount: 1 },
        $set: { lastViewed: new Date() },
      });

      // Log activity if user is authenticated
      if (this.context.user) {
        await this.logActivity(contentId, KBActivityAction.VIEWED);
      }
    } catch (error) {
      logger.error(`Error updating view count for content ${contentId}:`, error);
      // Don't throw - view count update failure shouldn't break the operation
    }
  }

  /**
   * Like content
   */
  @roles(['USER'])
  async likeContent(contentId: string): Promise<void> {
    try {
      logger.debug(`User ${this.context.user._id} liking content ${contentId}`);

      // Verify content exists
      await Content.findById(contentId);

      // TODO: Implement likes with a dedicated collection or field
      logger.warn('Content likes not yet implemented');

      // Log activity
      await this.logActivity(contentId, KBActivityAction.VIEWED, { action: 'like' });
    } catch (error) {
      logger.error(`Error liking content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Unlike content
   */
  @roles(['USER'])
  async unlikeContent(contentId: string): Promise<void> {
    try {
      logger.debug(`User ${this.context.user._id} unliking content ${contentId}`);

      // Verify content exists
      await Content.findById(contentId);

      // TODO: Implement likes with a dedicated collection or field
      logger.warn('Content likes not yet implemented');

      // Log activity
      await this.logActivity(contentId, KBActivityAction.VIEWED, { action: 'unlike' });
    } catch (error) {
      logger.error(`Error unliking content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Log activity
   */
  @roles(['USER', 'ANON'])
  async logActivity(
    contentId: string,
    action: KBActivityAction,
    metadata?: any
  ): Promise<void> {
    try {
      if (!this.context.user) {
        return; // Don't log activity for anonymous users
      }

      // TODO: Implement activity logging with a dedicated collection
      logger.debug(`Activity logged for content ${contentId}: ${action}`);
    } catch (error) {
      logger.error(`Error logging activity for content ${contentId}:`, error);
      // Don't throw - activity logging failure shouldn't break the operation
    }
  }

  /**
   * Lifecycle methods
   */
  async onStartup(): Promise<void> {
    logger.info('CollaborationService started');
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
  static reactory: Reactory.Service.IReactoryServiceDefinition<CollaborationService> = {
    id: 'kb.CollaborationService@1.0.0',
    nameSpace: 'kb',
    name: 'CollaborationService',
    version: '1.0.0',
    description: 'Service for managing collaborative features',
    service: (
      props: Reactory.Service.IReactoryServiceProps,
      context: Reactory.Server.IReactoryContext
    ) => {
      return new CollaborationService(props, context);
    },
    dependencies: [],
    serviceType: 'data',
  };
}

export default CollaborationService;
export { ICollaborationService };

