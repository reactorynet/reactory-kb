/**
 * Article Service
 * 
 * Manages knowledge article entities using the Content model with contentType: 'article'.
 * Provides versioning, publishing, and attachment management capabilities.
 */

import Reactory from '@reactorynet/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { Content } from '@reactory/server-modules/reactory-core/models';
import logger from '@reactory/server-core/logging';
import {
  IKBContent,
  ICreateArticleInput,
  IUpdateArticleInput,
  IArticleFilter,
  KBContentType,
  KBArticleStatus,
  IArticleVersion,
} from '../types';
import { KBVersion } from '../models';

/**
 * Article Service Interface
 */
export interface IArticleService extends Reactory.Service.IReactoryService {
  /**
   * Create a new article
   */
  createArticle(input: ICreateArticleInput): Promise<IKBContent>;

  /**
   * Update an existing article
   */
  updateArticle(id: string, input: IUpdateArticleInput): Promise<IKBContent>;

  /**
   * Delete an article
   */
  deleteArticle(id: string): Promise<boolean>;

  /**
   * Get an article by ID
   */
  getArticle(id: string): Promise<IKBContent>;

  /**
   * Get an article by slug
   */
  getArticleBySlug(slug: string, kbId?: string): Promise<IKBContent>;

  /**
   * Publish an article
   */
  publishArticle(id: string): Promise<IKBContent>;

  /**
   * Archive an article
   */
  archiveArticle(id: string): Promise<IKBContent>;

  /**
   * Get article versions
   */
  getArticleVersions(id: string): Promise<IArticleVersion[]>;

  /**
   * Revert to a specific version
   */
  revertToVersion(id: string, versionNumber: number): Promise<IKBContent>;

  /**
   * Add attachment to article
   */
  addAttachment(articleId: string, fileId: string): Promise<IKBContent>;

  /**
   * Remove attachment from article
   */
  removeAttachment(articleId: string, attachmentId: string): Promise<IKBContent>;

  /**
   * List articles with filtering
   */
  listArticles(filter: IArticleFilter): Promise<IKBContent[]>;

  /**
   * Update view count
   */
  updateViewCount(id: string): Promise<void>;
}

/**
 * Article Service Implementation
 */
class ArticleService implements IArticleService {
  name: string = 'ArticleService';
  nameSpace: string = 'kb';
  version: string = '1.0.0';

  props: Reactory.Service.IReactoryServiceProps;
  context: Reactory.Server.IReactoryContext;
  fileService: Reactory.Service.IReactoryFileService;
  kbService: any; // IKnowledgeBaseService

  constructor(
    props: Reactory.Service.IReactoryServiceProps,
    context: Reactory.Server.IReactoryContext
  ) {
    this.props = props;
    this.context = context;
  }

  /**
   * Generate a unique slug from title
   */
  private generateSlug(title: string, kbId?: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    return kbId ? `${kbId}-${baseSlug}` : baseSlug;
  }

  /**
   * Create version record
   */
  private async createVersion(
    contentId: string,
    content: string,
    summary: string,
    changeSummary?: string
  ): Promise<void> {
    try {
      // Get current version count
      const versionCount = await KBVersion.countDocuments({ contentId });
      const versionNumber = versionCount + 1;

      await KBVersion.create({
        contentId,
        versionNumber,
        content,
        summary: summary || '',
        changeSummary: changeSummary || `Version ${versionNumber}`,
        author: this.context.user._id,
        createdAt: new Date(),
      });

      logger.debug(`Created version ${versionNumber} for article ${contentId}`);
    } catch (error) {
      logger.error(`Error creating version for article ${contentId}:`, error);
      // Don't throw - versioning failure shouldn't block the main operation
    }
  }

  /**
   * Build query from filter
   */
  private buildQuery(filter: IArticleFilter = {}): any {
    const query: any = { contentType: KBContentType.ARTICLE };

    if (filter.knowledgeBaseId) {
      query.knowledgeBase = filter.knowledgeBaseId;
    }

    if (filter.status) {
      query.status = Array.isArray(filter.status) ? { $in: filter.status } : filter.status;
    }

    if (filter.authorId) {
      query.createdBy = filter.authorId;
    }

    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags };
    }

    if (filter.categories && filter.categories.length > 0) {
      query.categories = { $in: filter.categories };
    }

    if (filter.lng) {
      query.lng = filter.lng;
    }

    if (filter.published !== undefined) {
      query.published = filter.published;
    }

    if (filter.createdAfter || filter.createdBefore) {
      query.createdAt = {};
      if (filter.createdAfter) {
        query.createdAt.$gte = filter.createdAfter;
      }
      if (filter.createdBefore) {
        query.createdAt.$lte = filter.createdBefore;
      }
    }

    return query;
  }

  /**
   * Create a new article
   */
  @roles(['USER', 'ADMIN'])
  async createArticle(input: ICreateArticleInput): Promise<IKBContent> {
    try {
      logger.debug('Creating article:', input);

      // Verify KB exists
      const kbService = this.props.$services.kb?.KnowledgeBaseService;
      if (!kbService) {
        throw new Error('KnowledgeBaseService not available');
      }

      await kbService.getKnowledgeBase(input.kbId);

      // Generate slug from title
      const slug = this.generateSlug(input.title, input.kbId);

      // Check if slug already exists in this KB
      const existing = await Content.findOne({
        slug,
        knowledgeBase: input.kbId,
        contentType: KBContentType.ARTICLE,
      });

      if (existing) {
        throw new Error(`Article with slug "${slug}" already exists in this knowledge base`);
      }

      // Prepare article content
      const articleContent: Partial<IKBContent> = {
        slug,
        title: input.title,
        description: input.description,
        content: input.content,
        contentType: KBContentType.ARTICLE,
        knowledgeBase: input.kbId,
        lng: input.lng || 'en',
        tags: input.tags || [],
        categories: input.categories || [],
        status: KBArticleStatus.DRAFT,
        published: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: this.context.user._id,
        updatedBy: this.context.user._id,
        partner: this.context.partner?._id,
        organization: this.context.partner?.organization,
        viewCount: 0,
        allowComments: true,
        localizedContent: input.localizedContent || [],
        attachments: input.attachments || [],
        parentContent: input.parentContent,
        order: input.order || 0,
      };

      // Create the article
      const article = await Content.create(articleContent);

      // Create initial version
      await this.createVersion(
        article._id.toString(),
        input.content,
        input.summary || '',
        'Initial version'
      );

      logger.info(`Article created: ${article._id}`);
      return article.toObject() as IKBContent;
    } catch (error) {
      logger.error('Error creating article:', error);
      throw error;
    }
  }

  /**
   * Update an existing article
   */
  @roles(['USER', 'ADMIN'])
  async updateArticle(id: string, input: IUpdateArticleInput): Promise<IKBContent> {
    try {
      logger.debug(`Updating article ${id}:`, input);

      const article = await Content.findOne({
        _id: id,
        contentType: KBContentType.ARTICLE,
      });

      if (!article) {
        throw new Error(`Article ${id} not found`);
      }

      // Check permissions
      if (article.createdBy.toString() !== this.context.user._id.toString()) {
        // TODO: Check if user has write permission via PermissionService
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to update this article');
        }
      }

      // Track if content changed for versioning
      let contentChanged = false;
      const oldContent = article.content;

      // Update fields
      if (input.title) article.title = input.title;
      if (input.description !== undefined) article.description = input.description;
      if (input.content !== undefined && input.content !== oldContent) {
        article.content = input.content;
        contentChanged = true;
      }
      if (input.lng) (article as any).lng = input.lng;
      if (input.tags) (article as any).tags = input.tags;
      if (input.categories) (article as any).categories = input.categories;
      if (input.status) (article as any).status = input.status;
      if (input.localizedContent) (article as any).localizedContent = input.localizedContent;
      if (input.metadata) {
        article.set('metadata', input.metadata);
      }
      if (input.parentContent !== undefined) (article as any).parentContent = input.parentContent;
      if (input.order !== undefined) (article as any).order = input.order;

      article.updatedAt = new Date();
      article.updatedBy = this.context.user._id;

      await article.save();

      // Create new version if content changed
      if (contentChanged) {
        await this.createVersion(
          id,
          input.content,
          input.summary || '',
          'Article updated'
        );
      }

      logger.info(`Article updated: ${article._id}`);
      return article.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error updating article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an article
   */
  @roles(['USER', 'ADMIN'])
  async deleteArticle(id: string): Promise<boolean> {
    try {
      logger.debug(`Deleting article ${id}`);

      const article = await Content.findOne({
        _id: id,
        contentType: KBContentType.ARTICLE,
      });

      if (!article) {
        throw new Error(`Article ${id} not found`);
      }

      // Check permissions
      if (article.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to delete this article');
        }
      }

      // Delete all versions
      await KBVersion.deleteMany({ contentId: id });

      // TODO: Delete comments, bookmarks, attachments

      // Delete the article
      await article.deleteOne();

      logger.info(`Article deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get an article by ID
   */
  @roles(['USER', 'ANON'])
  async getArticle(id: string): Promise<IKBContent> {
    try {
      const article = await Content.findOne({
        _id: id,
        contentType: KBContentType.ARTICLE,
      });

      if (!article) {
        throw new Error(`Article ${id} not found`);
      }

      // Check if article is published or user has access
      const articleObj = article.toObject() as IKBContent;
      if (!articleObj.published) {
        if (!this.context.user) {
          throw new Error('Access denied: Article is not published');
        }

        // Allow owner and admins to view unpublished articles
        const isOwner = article.createdBy.toString() === this.context.user._id.toString();
        const isAdmin = this.context.user.roles?.includes('ADMIN');

        if (!isOwner && !isAdmin) {
          throw new Error('Access denied: Article is not published');
        }
      }

      return articleObj;
    } catch (error) {
      logger.error(`Error getting article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get an article by slug
   */
  @roles(['USER', 'ANON'])
  async getArticleBySlug(slug: string, kbId?: string): Promise<IKBContent> {
    try {
      const query: any = {
        slug,
        contentType: KBContentType.ARTICLE,
      };

      if (kbId) {
        query.knowledgeBase = kbId;
      }

      const article = await Content.findOne(query);

      if (!article) {
        throw new Error(`Article with slug "${slug}" not found`);
      }

      // Check if article is published or user has access
      const articleObj = article.toObject() as IKBContent;
      if (!articleObj.published) {
        if (!this.context.user) {
          throw new Error('Access denied: Article is not published');
        }

        const isOwner = article.createdBy.toString() === this.context.user._id.toString();
        const isAdmin = this.context.user.roles?.includes('ADMIN');

        if (!isOwner && !isAdmin) {
          throw new Error('Access denied: Article is not published');
        }
      }

      return articleObj;
    } catch (error) {
      logger.error(`Error getting article by slug "${slug}":`, error);
      throw error;
    }
  }

  /**
   * Publish an article
   */
  @roles(['USER', 'ADMIN'])
  async publishArticle(id: string): Promise<IKBContent> {
    try {
      logger.debug(`Publishing article ${id}`);

      const article = await Content.findOne({
        _id: id,
        contentType: KBContentType.ARTICLE,
      });

      if (!article) {
        throw new Error(`Article ${id} not found`);
      }

      // Check permissions
      if (article.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to publish this article');
        }
      }

      (article as any).status = KBArticleStatus.PUBLISHED;
      article.published = true;
      article.updatedAt = new Date();
      article.updatedBy = this.context.user._id;

      await article.save();

      logger.info(`Article published: ${id}`);
      return article.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error publishing article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Archive an article
   */
  @roles(['USER', 'ADMIN'])
  async archiveArticle(id: string): Promise<IKBContent> {
    try {
      logger.debug(`Archiving article ${id}`);

      const article = await Content.findOne({
        _id: id,
        contentType: KBContentType.ARTICLE,
      });

      if (!article) {
        throw new Error(`Article ${id} not found`);
      }

      // Check permissions
      if (article.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to archive this article');
        }
      }

      (article as any).status = KBArticleStatus.ARCHIVED;
      article.published = false;
      article.updatedAt = new Date();
      article.updatedBy = this.context.user._id;

      await article.save();

      logger.info(`Article archived: ${id}`);
      return article.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error archiving article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get article versions
   */
  @roles(['USER'])
  async getArticleVersions(id: string): Promise<IArticleVersion[]> {
    try {
      // Verify article exists and user has access
      await this.getArticle(id);

      const versions = await KBVersion.find({ contentId: id })
        .sort({ versionNumber: -1 })
        .lean();

      return versions as IArticleVersion[];
    } catch (error) {
      logger.error(`Error getting versions for article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Revert to a specific version
   */
  @roles(['USER', 'ADMIN'])
  async revertToVersion(id: string, versionNumber: number): Promise<IKBContent> {
    try {
      logger.debug(`Reverting article ${id} to version ${versionNumber}`);

      const article = await Content.findOne({
        _id: id,
        contentType: KBContentType.ARTICLE,
      });

      if (!article) {
        throw new Error(`Article ${id} not found`);
      }

      // Check permissions
      if (article.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to revert this article');
        }
      }

      // Get the version
      const version = await KBVersion.findOne({ contentId: id, versionNumber });

      if (!version) {
        throw new Error(`Version ${versionNumber} not found for article ${id}`);
      }

      // Update article content with version content
      article.content = version.content;
      article.updatedAt = new Date();
      article.updatedBy = this.context.user._id;

      await article.save();

      // Create new version for the revert
      await this.createVersion(
        id,
        version.content,
        version.summary,
        `Reverted to version ${versionNumber}`
      );

      logger.info(`Article ${id} reverted to version ${versionNumber}`);
      return article.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error reverting article ${id} to version ${versionNumber}:`, error);
      throw error;
    }
  }

  /**
   * Add attachment to article
   */
  @roles(['USER', 'ADMIN'])
  async addAttachment(articleId: string, fileId: string): Promise<IKBContent> {
    try {
      logger.debug(`Adding attachment ${fileId} to article ${articleId}`);

      const article = await Content.findOne({
        _id: articleId,
        contentType: KBContentType.ARTICLE,
      });

      if (!article) {
        throw new Error(`Article ${articleId} not found`);
      }

      // Check permissions
      if (article.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to modify this article');
        }
      }

      // Add attachment ID to article
      const attachments = (article as any).attachments || [];
      if (!attachments.includes(fileId)) {
        attachments.push(fileId);
        (article as any).attachments = attachments;
        article.updatedAt = new Date();
        article.updatedBy = this.context.user._id;
        await article.save();
      }

      logger.info(`Attachment ${fileId} added to article ${articleId}`);
      return article.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error adding attachment to article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * Remove attachment from article
   */
  @roles(['USER', 'ADMIN'])
  async removeAttachment(articleId: string, attachmentId: string): Promise<IKBContent> {
    try {
      logger.debug(`Removing attachment ${attachmentId} from article ${articleId}`);

      const article = await Content.findOne({
        _id: articleId,
        contentType: KBContentType.ARTICLE,
      });

      if (!article) {
        throw new Error(`Article ${articleId} not found`);
      }

      // Check permissions
      if (article.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to modify this article');
        }
      }

      // Remove attachment ID from article
      const attachments = (article as any).attachments || [];
      const filteredAttachments = attachments.filter((id: string) => id !== attachmentId);
      (article as any).attachments = filteredAttachments;
      article.updatedAt = new Date();
      article.updatedBy = this.context.user._id;
      await article.save();

      logger.info(`Attachment ${attachmentId} removed from article ${articleId}`);
      return article.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error removing attachment from article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * List articles with filtering
   */
  @roles(['USER', 'ANON'])
  async listArticles(filter: IArticleFilter = {}): Promise<IKBContent[]> {
    try {
      const query = this.buildQuery(filter);

      // Non-authenticated users only see published articles
      if (!this.context.user) {
        query.published = true;
        query.status = KBArticleStatus.PUBLISHED;
      }

      const sortBy = filter.sortBy || 'createdAt';
      const sortDirection = filter.sortDirection === 'asc' ? 1 : -1;
      const limit = filter.limit || 50;
      const offset = filter.offset || 0;

      const articles = await Content.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(offset)
        .limit(limit)
        .lean();

      return articles as IKBContent[];
    } catch (error) {
      logger.error('Error listing articles:', error);
      throw error;
    }
  }

  /**
   * Update view count
   */
  @roles(['USER', 'ANON'])
  async updateViewCount(id: string): Promise<void> {
    try {
      await Content.findByIdAndUpdate(id, {
        $inc: { viewCount: 1 },
        $set: { lastViewed: new Date() },
      });
    } catch (error) {
      logger.error(`Error updating view count for article ${id}:`, error);
      // Don't throw - view count update failure shouldn't break the operation
    }
  }

  /**
   * Lifecycle methods
   */
  async onStartup(): Promise<void> {
    logger.info('ArticleService started');
  }

  getExecutionContext(): Reactory.Server.IReactoryContext {
    return this.context;
  }

  setExecutionContext(context: Reactory.Server.IReactoryContext): boolean {
    this.context = context;
    return true;
  }

  setFileService(fileService: Reactory.Service.IReactoryFileService): void {
    this.fileService = fileService;
  }

  setKBService(kbService: any): void {
    this.kbService = kbService;
  }

  /**
   * Service definition
   */
  static reactory: Reactory.Service.IReactoryServiceDefinition<ArticleService> = {
    id: 'kb.ArticleService@1.0.0',
    nameSpace: 'kb',
    name: 'ArticleService',
    version: '1.0.0',
    description: 'Service for managing knowledge base articles',
    service: (
      props: Reactory.Service.IReactoryServiceProps,
      context: Reactory.Server.IReactoryContext
    ) => {
      return new ArticleService(props, context);
    },
    dependencies: [
      { id: 'core.ReactoryFileService@1.0.0', alias: 'fileService' },
      { id: 'kb.KnowledgeBaseService@1.0.0', alias: 'kbService' },
    ],
    serviceType: 'data',
  };
}

export default ArticleService;
export { IArticleService };

