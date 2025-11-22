/**
 * Knowledge Base GraphQL Resolvers
 * 
 * Class-based resolvers with decorators for KB queries and mutations
 */

import Reactory from '@reactory/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { resolver, property, query, mutation } from '@reactory/server-core/models/graphql/decorators/resolver';
import { IKnowledgeBaseService } from 'modules/reactory-kb/services/KnowledgeBaseService';
import { IArticleService } from 'modules/reactory-kb/services/ArticleService';
import { ICollaborationService } from 'modules/reactory-kb/services/CollaborationService';
import { ILocalizationService } from 'modules/reactory-kb/services/LocalizationService';

/**
 * Helper functions to get KB services
 */
const getKBService = (context: Reactory.Server.IReactoryContext) => {
  return context.getService<IKnowledgeBaseService>('kb.KnowledgeBaseService@1.0.0');
};

const getArticleService = (context: Reactory.Server.IReactoryContext) => {
  return context.getService<IArticleService>('kb.ArticleService@1.0.0');
};

const getSearchService = (context: Reactory.Server.IReactoryContext) => {
  return context.getService<Reactory.Service.ISearchService>('kb.SearchService@1.0.0');
};

const getCollaborationService = (context: Reactory.Server.IReactoryContext) => {
  return context.getService<ICollaborationService>('kb.CollaborationService@1.0.0');
};

const getLocalizationService = (context: Reactory.Server.IReactoryContext) => {
  return context.getService<ILocalizationService>('kb.LocalizationService@1.0.0');
};

// @ts-ignore - decorator requires no parentheses
@resolver
class KBResolver {
  resolver: any;

  // ============================================
  // KNOWLEDGE BASE QUERIES
  // ============================================

  @roles(['USER', 'ANON'], 'args.context')
  @query('getKnowledgeBase')
  async getKnowledgeBase(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.getKnowledgeBase(params.id);
    } catch (error) {
      context.log('Error fetching knowledge base', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ANON'], 'args.context')
  @query('listKnowledgeBases')
  async listKnowledgeBases(
    obj: any,
    params: { filter?: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.listKnowledgeBases(params.filter || {});
    } catch (error) {
      context.log('Error listing knowledge bases', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ANON'], 'args.context')
  @query('getKBArticles')
  async getKBArticles(
    obj: any,
    params: { kbId: string; filter?: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.getKBArticles(params.kbId, params.filter || {});
    } catch (error) {
      context.log('Error fetching KB articles', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ANON'], 'args.context')
  @query('getKBCategories')
  async getKBCategories(
    obj: any,
    params: { kbId: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.getKBCategories(params.kbId);
    } catch (error) {
      context.log('Error fetching KB categories', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ANON'], 'args.context')
  @query('getKBStats')
  async getKBStats(
    obj: any,
    params: { kbId: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.getKBStatistics(params.kbId);
    } catch (error) {
      context.log('Error fetching KB statistics', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // ARTICLE QUERIES
  // ============================================

  @roles(['USER', 'ANON'], 'args.context')
  @query('getArticle')
  async getArticle(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.getArticle(params.id);
    } catch (error) {
      context.log('Error fetching article', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @query('getArticleVersions')
  async getArticleVersions(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.getArticleVersions(params.id);
    } catch (error) {
      context.log('Error fetching article versions', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ANON'], 'args.context')
  @query('getLocalizedArticle')
  async getLocalizedArticle(
    obj: any,
    params: { id: string; lng: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const localizationService = getLocalizationService(context);
    if (!localizationService) throw new Error('LocalizationService not available');

    try {
      return await localizationService.getLocalizedContent(params.id, params.lng);
    } catch (error) {
      context.log('Error fetching localized article', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // SEARCH QUERIES
  // ============================================

  @roles(['USER', 'ANON'], 'args.context')
  @query('searchKnowledgeBases')
  async searchKnowledgeBases(
    obj: any,
    params: { query: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const searchService = getSearchService(context);
    if (!searchService) throw new Error('SearchService not available');

    try {
      return await searchService.searchKnowledgeBases(params.query);
    } catch (error) {
      context.log('Error searching knowledge bases', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ANON'], 'args.context')
  @query('searchArticles')
  async searchArticles(
    obj: any,
    params: { query: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const searchService = getSearchService(context);
    if (!searchService) throw new Error('SearchService not available');

    try {
      return await searchService.searchArticles(params.query);
    } catch (error) {
      context.log('Error searching articles', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ANON'], 'args.context')
  @query('getSearchSuggestions')
  async getSearchSuggestions(
    obj: any,
    params: { query: string; limit?: number },
    context: Reactory.Server.IReactoryContext
  ) {
    const searchService = getSearchService(context);
    if (!searchService) throw new Error('SearchService not available');

    try {
      return await searchService.getSearchSuggestions(params.query, params.limit);
    } catch (error) {
      context.log('Error fetching search suggestions', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // COLLABORATION QUERIES
  // ============================================

  @roles(['USER', 'ANON'], 'args.context')
  @query('getComments')
  async getComments(
    obj: any,
    params: { contentId: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.getComments(params.contentId);
    } catch (error) {
      context.log('Error fetching comments', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @query('getUserBookmarks')
  async getUserBookmarks(
    obj: any,
    params: { userId?: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      const uid = params.userId || context.user._id.toString();
      return await collabService.getUserBookmarks(uid);
    } catch (error) {
      context.log('Error fetching user bookmarks', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @query('getContentActivity')
  async getContentActivity(
    obj: any,
    params: { contentId: string; limit?: number },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.getContentActivity(params.contentId, params.limit);
    } catch (error) {
      context.log('Error fetching content activity', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // KNOWLEDGE BASE MUTATIONS
  // ============================================

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('createKnowledgeBase')
  async createKnowledgeBase(
    obj: any,
    params: { input: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.createKnowledgeBase(params.input);
    } catch (error) {
      context.log('Error creating knowledge base', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('updateKnowledgeBase')
  async updateKnowledgeBase(
    obj: any,
    params: { id: string; input: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.updateKnowledgeBase(params.id, params.input);
    } catch (error) {
      context.log('Error updating knowledge base', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['ADMIN'], 'args.context')
  @mutation('deleteKnowledgeBase')
  async deleteKnowledgeBase(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.deleteKnowledgeBase(params.id);
    } catch (error) {
      context.log('Error deleting knowledge base', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('shareKnowledgeBase')
  async shareKnowledgeBase(
    obj: any,
    params: { id: string; permissions: any[] },
    context: Reactory.Server.IReactoryContext
  ) {
    const kbService = getKBService(context);
    if (!kbService) throw new Error('KnowledgeBaseService not available');

    try {
      return await kbService.shareKnowledgeBase(params.id, params.permissions);
    } catch (error) {
      context.log('Error sharing knowledge base', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // ARTICLE MUTATIONS
  // ============================================

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('createArticle')
  async createArticle(
    obj: any,
    params: { input: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.createArticle(params.input);
    } catch (error) {
      context.log('Error creating article', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('updateArticle')
  async updateArticle(
    obj: any,
    params: { id: string; input: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.updateArticle(params.id, params.input);
    } catch (error) {
      context.log('Error updating article', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('deleteArticle')
  async deleteArticle(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.deleteArticle(params.id);
    } catch (error) {
      context.log('Error deleting article', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('publishArticle')
  async publishArticle(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.publishArticle(params.id);
    } catch (error) {
      context.log('Error publishing article', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('archiveArticle')
  async archiveArticle(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.archiveArticle(params.id);
    } catch (error) {
      context.log('Error archiving article', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // LOCALIZATION MUTATIONS
  // ============================================

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('addLocalizedContent')
  async addLocalizedContent(
    obj: any,
    params: { id: string; localized: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const localizationService = getLocalizationService(context);
    if (!localizationService) throw new Error('LocalizationService not available');

    try {
      return await localizationService.addLocalizedContent(params.id, params.localized);
    } catch (error) {
      context.log('Error adding localized content', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('removeLocalizedContent')
  async removeLocalizedContent(
    obj: any,
    params: { id: string; lng: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const localizationService = getLocalizationService(context);
    if (!localizationService) throw new Error('LocalizationService not available');

    try {
      return await localizationService.removeLocalizedContent(params.id, params.lng);
    } catch (error) {
      context.log('Error removing localized content', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // COLLABORATION MUTATIONS
  // ============================================

  @roles(['USER'], 'args.context')
  @mutation('addComment')
  async addComment(
    obj: any,
    params: { contentId: string; content: string; parent?: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.addComment(params.contentId, params.content, params.parent);
    } catch (error) {
      context.log('Error adding comment', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @mutation('updateComment')
  async updateComment(
    obj: any,
    params: { id: string; content: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.updateComment(params.id, params.content);
    } catch (error) {
      context.log('Error updating comment', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @mutation('deleteComment')
  async deleteComment(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.deleteComment(params.id);
    } catch (error) {
      context.log('Error deleting comment', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @mutation('addBookmark')
  async addBookmark(
    obj: any,
    params: { contentId: string; note?: string; tags?: string[] },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.addBookmark(params.contentId, params.note, params.tags);
    } catch (error) {
      context.log('Error adding bookmark', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @mutation('removeBookmark')
  async removeBookmark(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.removeBookmark(params.id);
    } catch (error) {
      context.log('Error removing bookmark', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @mutation('likeContent')
  async likeContent(
    obj: any,
    params: { contentId: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.likeContent(params.contentId);
    } catch (error) {
      context.log('Error liking content', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER'], 'args.context')
  @mutation('unlikeContent')
  async unlikeContent(
    obj: any,
    params: { contentId: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const collabService = getCollaborationService(context);
    if (!collabService) throw new Error('CollaborationService not available');

    try {
      return await collabService.unlikeContent(params.contentId);
    } catch (error) {
      context.log('Error unliking content', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // FILE OPERATION MUTATIONS
  // ============================================

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('uploadAttachment')
  async uploadAttachment(
    obj: any,
    params: { contentId: string; file: any },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.addAttachment(params.contentId, params.file);
    } catch (error) {
      context.log('Error uploading attachment', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  @roles(['USER', 'ADMIN'], 'args.context')
  @mutation('deleteAttachment')
  async deleteAttachment(
    obj: any,
    params: { id: string },
    context: Reactory.Server.IReactoryContext
  ) {
    const articleService = getArticleService(context);
    if (!articleService) throw new Error('ArticleService not available');

    try {
      return await articleService.removeAttachment(params.id);
    } catch (error) {
      context.log('Error deleting attachment', { error, params }, 'error', 'KBResolver');
      throw error;
    }
  }

  // ============================================
  // PROPERTY RESOLVERS
  // ============================================

  @property('KBContent', 'id')
  contentId(obj: any) {
    return obj._id || obj.id;
  }

  @property('KBContent', 'author')
  async contentAuthor(obj: any, args: any, context: Reactory.Server.IReactoryContext) {
    // If author is already populated, return it
    if (typeof obj.createdBy === 'object' && obj.createdBy !== null) {
      return obj.createdBy;
    }

    // Fetch user by ID if needed
    const userService = context.getService('core.UserService@1.0.0');
    if (userService && obj.createdBy) {
      return await userService.getUserById(obj.createdBy);
    }

    return null;
  }

  @property('KBComment', 'id')
  commentId(obj: any) {
    return obj._id || obj.id;
  }

  @property('KBComment', 'author')
  async commentAuthor(obj: any, args: any, context: Reactory.Server.IReactoryContext) {
    if (typeof obj.author === 'object' && obj.author !== null) {
      return obj.author;
    }

    const userService = context.getService('core.UserService@1.0.0');
    if (userService && obj.author) {
      return await userService.getUserById(obj.author);
    }

    return null;
  }

  @property('KBBookmark', 'id')
  bookmarkId(obj: any) {
    return obj._id || obj.id;
  }

  @property('KBAttachment', 'id')
  attachmentId(obj: any) {
    return obj._id || obj.id;
  }

  @property('KBAttachment', 'uploadedBy')
  async attachmentUploadedBy(obj: any, args: any, context: Reactory.Server.IReactoryContext) {
    if (typeof obj.uploadedBy === 'object' && obj.uploadedBy !== null) {
      return obj.uploadedBy;
    }

    const userService = context.getService('core.UserService@1.0.0');
    if (userService && obj.uploadedBy) {
      return await userService.getUserById(obj.uploadedBy);
    }

    return null;
  }

  @property('KBVersion', 'id')
  versionId(obj: any) {
    return obj._id || obj.id;
  }

  @property('KBVersion', 'author')
  async versionAuthor(obj: any, args: any, context: Reactory.Server.IReactoryContext) {
    if (typeof obj.author === 'object' && obj.author !== null) {
      return obj.author;
    }

    const userService = context.getService('core.UserService@1.0.0');
    if (userService && obj.author) {
      return await userService.getUserById(obj.author);
    }

    return null;
  }

  @property('KBPermission', 'id')
  permissionId(obj: any) {
    return obj._id || obj.id;
  }

  @property('KBPermission', 'grantedBy')
  async permissionGrantedBy(obj: any, args: any, context: Reactory.Server.IReactoryContext) {
    if (typeof obj.grantedBy === 'object' && obj.grantedBy !== null) {
      return obj.grantedBy;
    }

    const userService = context.getService('core.UserService@1.0.0');
    if (userService && obj.grantedBy) {
      return await userService.getUserById(obj.grantedBy);
    }

    return null;
  }
}

export default KBResolver;
