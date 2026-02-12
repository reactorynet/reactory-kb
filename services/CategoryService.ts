/**
 * Category Service
 * 
 * Manages categories for organizing knowledge base articles.
 * Categories support hierarchical structures (parent/child relationships).
 */

import Reactory from '@reactory/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { Content } from '@reactory/server-modules/reactory-core/models';
import logger from '@reactory/server-core/logging';
import {
  IKBContent,
  KBContentType,
  ICategoryInput,
  ICategoryTreeNode,
  ICategoryStats,
} from '../types';

/**
 * Category Service Interface
 */
export interface ICategoryService extends Reactory.Service.IReactoryService {
  /**
   * Create a new category
   */
  createCategory(input: ICategoryInput): Promise<IKBContent>;

  /**
   * Update an existing category
   */
  updateCategory(id: string, input: ICategoryInput): Promise<IKBContent>;

  /**
   * Delete a category
   */
  deleteCategory(id: string): Promise<boolean>;

  /**
   * Get a category by ID
   */
  getCategory(id: string): Promise<IKBContent>;

  /**
   * Get category tree for a knowledge base
   */
  getCategoryTree(kbId: string): Promise<ICategoryTreeNode[]>;

  /**
   * Move category to new parent
   */
  moveCategory(id: string, newParentId: string | null): Promise<IKBContent>;

  /**
   * Get articles in a category
   */
  getArticlesByCategory(categoryId: string): Promise<IKBContent[]>;

  /**
   * Get category statistics
   */
  getCategoryStats(categoryId: string): Promise<ICategoryStats>;
}

/**
 * Category Service Implementation
 */
class CategoryService implements ICategoryService {
  name: string = 'CategoryService';
  nameSpace: string = 'kb';
  version: string = '1.0.0';

  props: Reactory.Service.IReactoryServiceProps;
  context: Reactory.Server.IReactoryContext;
  kbService: any;

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
  private generateSlug(title: string, kbId: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    return `${kbId}-cat-${baseSlug}`;
  }

  /**
   * Build category tree from flat list
   */
  private buildTree(categories: IKBContent[], parentId: string | null = null): ICategoryTreeNode[] {
    const tree: ICategoryTreeNode[] = [];

    for (const category of categories) {
      const categoryParent = (category as any).parentContent;
      const currentParentId = categoryParent ? categoryParent.toString() : null;

      if (currentParentId === parentId) {
        const node: ICategoryTreeNode = {
          id: category.id?.toString() || '',
          title: category.title || '',
          description: category.description,
          slug: category.slug,
          order: (category as any).order || 0,
          articleCount: 0, // Will be populated separately
          children: this.buildTree(categories, category.id?.toString() || ''),
        };
        tree.push(node);
      }
    }

    return tree.sort((a, b) => a.order - b.order);
  }

  /**
   * Create a new category
   */
  @roles(['USER', 'ADMIN'])
  async createCategory(input: ICategoryInput): Promise<IKBContent> {
    try {
      logger.debug('Creating category:', input);

      // Verify KB exists
      const kbService = this.props.$services.kb?.KnowledgeBaseService;
      if (!kbService) {
        throw new Error('KnowledgeBaseService not available');
      }

      await kbService.getKnowledgeBase(input.knowledgeBaseId);

      // Generate slug from title
      const slug = this.generateSlug(input.title, input.knowledgeBaseId);

      // Check if slug already exists in this KB
      const existing = await Content.findOne({
        slug,
        knowledgeBase: input.knowledgeBaseId,
        contentType: KBContentType.CATEGORY,
      });

      if (existing) {
        throw new Error(`Category with slug "${slug}" already exists in this knowledge base`);
      }

      // If parent specified, verify it exists
      if (input.parentId) {
        const parent = await Content.findOne({
          _id: input.parentId,
          knowledgeBase: input.knowledgeBaseId,
          contentType: KBContentType.CATEGORY,
        });

        if (!parent) {
          throw new Error(`Parent category ${input.parentId} not found`);
        }
      }

      // Prepare category content
      const categoryContent: Partial<IKBContent> = {
        slug,
        title: input.title,
        description: input.description,
        content: input.description || '',
        contentType: KBContentType.CATEGORY,
        knowledgeBase: input.knowledgeBaseId,
        parentContent: input.parentId || null,
        order: input.order || 0,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: this.context.user._id,
        updatedBy: this.context.user._id,
        partner: this.context.partner?._id,
        organization: this.context.partner?.organization,
      };

      // Create the category
      const category = await Content.create(categoryContent);

      logger.info(`Category created: ${category._id}`);
      return category.toObject() as IKBContent;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update an existing category
   */
  @roles(['USER', 'ADMIN'])
  async updateCategory(id: string, input: ICategoryInput): Promise<IKBContent> {
    try {
      logger.debug(`Updating category ${id}:`, input);

      const category = await Content.findOne({
        _id: id,
        contentType: KBContentType.CATEGORY,
      });

      if (!category) {
        throw new Error(`Category ${id} not found`);
      }

      // Check permissions
      if (category.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to update this category');
        }
      }

      // Update fields
      if (input.title) category.title = input.title;
      if (input.description !== undefined) {
        category.description = input.description;
        category.content = input.description;
      }
      if (input.order !== undefined) (category as any).order = input.order;

      category.updatedAt = new Date();
      category.updatedBy = this.context.user._id;

      await category.save();

      logger.info(`Category updated: ${category._id}`);
      return category.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a category
   */
  @roles(['USER', 'ADMIN'])
  async deleteCategory(id: string): Promise<boolean> {
    try {
      logger.debug(`Deleting category ${id}`);

      const category = await Content.findOne({
        _id: id,
        contentType: KBContentType.CATEGORY,
      });

      if (!category) {
        throw new Error(`Category ${id} not found`);
      }

      // Check permissions
      if (category.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to delete this category');
        }
      }

      // Check if category has children
      const childrenCount = await Content.countDocuments({
        parentContent: id,
        contentType: KBContentType.CATEGORY,
      });

      if (childrenCount > 0) {
        throw new Error('Cannot delete category with child categories. Delete or move children first.');
      }

      // Check if category has articles
      const articlesCount = await Content.countDocuments({
        categories: id,
        contentType: KBContentType.ARTICLE,
      });

      if (articlesCount > 0) {
        throw new Error('Cannot delete category with articles. Remove articles from category first.');
      }

      // Delete the category
      await category.deleteOne();

      logger.info(`Category deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a category by ID
   */
  @roles(['USER', 'ANON'])
  async getCategory(id: string): Promise<IKBContent> {
    try {
      const category = await Content.findOne({
        _id: id,
        contentType: KBContentType.CATEGORY,
      });

      if (!category) {
        throw new Error(`Category ${id} not found`);
      }

      return category.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error getting category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get category tree for a knowledge base
   */
  @roles(['USER', 'ANON'])
  async getCategoryTree(kbId: string): Promise<ICategoryTreeNode[]> {
    try {
      // Verify KB exists
      const kbService = this.props.$services.kb?.KnowledgeBaseService;
      if (kbService) {
        await kbService.getKnowledgeBase(kbId);
      }

      // Get all categories for this KB
      const categories = await Content.find({
        knowledgeBase: kbId,
        contentType: KBContentType.CATEGORY,
      })
        .sort({ order: 1, title: 1 })
        .lean();

      // Build tree structure
      const tree = this.buildTree(categories as IKBContent[], null);

      // Get article counts for each category
      for (const node of tree) {
        await this.populateArticleCounts(node);
      }

      return tree;
    } catch (error) {
      logger.error(`Error getting category tree for KB ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Populate article counts recursively
   */
  private async populateArticleCounts(node: ICategoryTreeNode): Promise<void> {
    // Count articles in this category
    const count = await Content.countDocuments({
      categories: node.id,
      contentType: KBContentType.ARTICLE,
    });
    node.articleCount = count;

    // Recursively populate children
    for (const child of node.children) {
      await this.populateArticleCounts(child);
    }
  }

  /**
   * Move category to new parent
   */
  @roles(['USER', 'ADMIN'])
  async moveCategory(id: string, newParentId: string | null): Promise<IKBContent> {
    try {
      logger.debug(`Moving category ${id} to parent ${newParentId}`);

      const category = await Content.findOne({
        _id: id,
        contentType: KBContentType.CATEGORY,
      });

      if (!category) {
        throw new Error(`Category ${id} not found`);
      }

      // Check permissions
      if (category.createdBy.toString() !== this.context.user._id.toString()) {
        const isAdmin = this.context.user.roles?.includes('ADMIN');
        if (!isAdmin) {
          throw new Error('Access denied: You do not have permission to move this category');
        }
      }

      // If new parent specified, verify it exists and isn't a descendant
      if (newParentId) {
        const newParent = await Content.findOne({
          _id: newParentId,
          knowledgeBase: (category as any).knowledgeBase,
          contentType: KBContentType.CATEGORY,
        });

        if (!newParent) {
          throw new Error(`Parent category ${newParentId} not found`);
        }

        // Check if newParent is a descendant of category (would create cycle)
        if (await this.isDescendant(id, newParentId)) {
          throw new Error('Cannot move category to its own descendant');
        }
      }

      // Update parent
      (category as any).parentContent = newParentId;
      category.updatedAt = new Date();
      category.updatedBy = this.context.user._id;

      await category.save();

      logger.info(`Category ${id} moved to parent ${newParentId}`);
      return category.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error moving category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check if target is a descendant of source
   */
  private async isDescendant(sourceId: string, targetId: string): Promise<boolean> {
    const target = await Content.findOne({
      _id: targetId,
      contentType: KBContentType.CATEGORY,
    });

    if (!target) {
      return false;
    }

    const parentId = (target as any).parentContent;
    if (!parentId) {
      return false;
    }

    if (parentId.toString() === sourceId) {
      return true;
    }

    return this.isDescendant(sourceId, parentId.toString());
  }

  /**
   * Get articles in a category
   */
  @roles(['USER', 'ANON'])
  async getArticlesByCategory(categoryId: string): Promise<IKBContent[]> {
    try {
      // Verify category exists
      await this.getCategory(categoryId);

      const query: any = {
        categories: categoryId,
        contentType: KBContentType.ARTICLE,
      };

      // Non-authenticated users only see published articles
      if (!this.context.user) {
        query.published = true;
      }

      const articles = await Content.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return articles as IKBContent[];
    } catch (error) {
      logger.error(`Error getting articles for category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  @roles(['USER'])
  async getCategoryStats(categoryId: string): Promise<ICategoryStats> {
    try {
      // Verify category exists
      const category = await this.getCategory(categoryId);

      // Count articles
      const articleCount = await Content.countDocuments({
        categories: categoryId,
        contentType: KBContentType.ARTICLE,
      });

      // Count published articles
      const publishedCount = await Content.countDocuments({
        categories: categoryId,
        contentType: KBContentType.ARTICLE,
        published: true,
      });

      // Count child categories
      const childCount = await Content.countDocuments({
        parentContent: categoryId,
        contentType: KBContentType.CATEGORY,
      });

      // Sum view counts
      const viewCountResult = await Content.aggregate([
        {
          $match: {
            categories: categoryId,
            contentType: KBContentType.ARTICLE,
          },
        },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$viewCount' },
          },
        },
      ]);
      const totalViews = viewCountResult[0]?.totalViews || 0;

      return {
        id: categoryId,
        categoryId,
        title: category.title || '',
        articleCount,
        publishedArticleCount: publishedCount,
        childCategoryCount: childCount,
        totalViews,
        lastUpdated: category.updatedAt,
      };
    } catch (error) {
      logger.error(`Error getting statistics for category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Lifecycle methods
   */
  async onStartup(): Promise<void> {
    logger.info('CategoryService started');
  }

  getExecutionContext(): Reactory.Server.IReactoryContext {
    return this.context;
  }

  setExecutionContext(context: Reactory.Server.IReactoryContext): boolean {
    this.context = context;
    return true;
  }

  setKBService(kbService: any): void {
    this.kbService = kbService;
  }

  /**
   * Service definition
   */
  static reactory: Reactory.Service.IReactoryServiceDefinition<CategoryService> = {
    id: 'kb.CategoryService@1.0.0',
    nameSpace: 'kb',
    name: 'CategoryService',
    version: '1.0.0',
    description: 'Service for managing knowledge base categories',
    service: (
      props: Reactory.Service.IReactoryServiceProps,
      context: Reactory.Server.IReactoryContext
    ) => {
      return new CategoryService(props, context);
    },
    dependencies: [{ id: 'kb.KnowledgeBaseService@1.0.0', alias: 'kbService' }],
    serviceType: 'data',
  };
}

export default CategoryService;
export { ICategoryService };

