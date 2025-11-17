import Reactory from '@reactory/reactory-core';

/**
 * Knowledge Base Models
 * 
 * Mongoose models for KB entities:
 * - KnowledgeBase: Core KB entity
 * - Article: Knowledge articles
 * - Category: Categorization system
 * - Tag: Tagging system
 * - Permission: Access control
 * - Version: Article history
 * - Comment: Article comments
 * - Bookmark: User bookmarks
 */

const models: Reactory.Models.IReactoryModel<unknown>[] = [];

export default models;
