/**
 * Reactory Knowledge Base - Core Type Definitions
 * 
 * This file contains the core types and interfaces for the Knowledge Base module.
 * These types extend the existing IReactoryContent model to provide KB-specific functionality.
 */

import Reactory from '@reactorynet/reactory-core';
import { ObjectId } from 'mongoose';

/**
 * Content types for knowledge base entities
 */
export enum KBContentType {
  KNOWLEDGE_BASE = 'knowledge-base',
  ARTICLE = 'article',
  CATEGORY = 'category',
  TEMPLATE = 'template',
  BOOK = 'book',
  CHAPTER = 'chapter',
  SECTION = 'section',
  PAGE = 'page',
}

/**
 * Visibility levels for knowledge base content
 */
export enum KBVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  SHARED = 'shared',
  ORGANIZATION = 'organization',
}

/**
 * Article status enum
 */
export enum KBArticleStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Extended content interface for Knowledge Base
 * This extends IReactoryContent with KB-specific fields
 */
export interface IKBContent extends Reactory.Models.IReactoryContent {
  // KB-specific content type
  contentType: KBContentType;
  
  // Multi-language support
  lng?: string; // Default language ISO code (e.g., 'en', 'fr', 'es')
  localizedContent?: IKBLocalizedContent[]; // Multi-language variants
  
  // Knowledge Base relationships
  knowledgeBase?: ObjectId | string; // Reference to parent KB (for articles)
  categories?: ObjectId[] | string[]; // Article categories
  tags?: string[]; // Article tags
  
  // KB metadata
  status?: KBArticleStatus; // Article status
  visibility?: KBVisibility; // Content visibility
  allowComments?: boolean; // Comments enabled
  viewCount?: number; // View counter
  lastViewed?: Date; // Last viewed timestamp
  
  // Relationships
  attachments?: ObjectId[] | string[]; // File attachments
  bookmarks?: ObjectId[] | string[]; // User bookmarks
  
  // Book/hierarchical content support
  parentContent?: ObjectId | string; // Parent content (for nested structures)
  childContent?: ObjectId[] | string[]; // Child content items
  order?: number; // Order within parent
}

/**
 * Localized content variant
 * Stores translations and localized versions of content
 */
export interface IKBLocalizedContent {
  lng: string; // Language ISO code (e.g., 'en', 'fr-CA')
  title?: string; // Localized title
  content?: string; // Localized content
  summary?: string; // Localized summary
  description?: string; // Localized description
  published: boolean; // Publication status for this language
  created: Date; // When this localization was created
  modified: Date; // When this localization was last modified
  modifiedBy?: ObjectId | string; // Who last modified this localization
}

/**
 * Knowledge Base statistics
 */
export interface IKBStats {
  id: string;
  knowledgeBaseId: string;
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  archivedArticles: number;
  totalViews: number;
  totalComments: number;
  totalBookmarks: number;
  totalCategories: number;
  availableLanguages: string[];
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * Knowledge Base filter options
 */
export interface IKBFilter {
  status?: KBArticleStatus | KBArticleStatus[];
  visibility?: KBVisibility | KBVisibility[];
  authorId?: string;
  tags?: string[];
  categories?: string[];
  lng?: string;
  contentType?: KBContentType | KBContentType[];
  published?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Article filter options
 */
export interface IArticleFilter {
  knowledgeBaseId?: string;
  status?: KBArticleStatus | KBArticleStatus[];
  authorId?: string;
  tags?: string[];
  categories?: string[];
  lng?: string;
  published?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Input type for creating a knowledge base
 */
export interface ICreateKBInput {
  slug: string; // Unique slug for the knowledge base
  title: string;
  description?: string;
  lng: string; // Default language
  content?: string;
  tags?: string[];
  categories?: string[];
  visibility?: KBVisibility;
  permissions?: IKBPermissionInput[];
  metadata?: Record<string, any>;
}

/**
 * Input type for updating a knowledge base
 */
export interface IUpdateKBInput {
  title?: string;
  description?: string;
  lng?: string;
  content?: string;
  tags?: string[];
  categories?: string[];
  status?: KBArticleStatus;
  visibility?: KBVisibility;
  metadata?: Record<string, any>;
}

/**
 * Input type for creating an article
 */
export interface ICreateArticleInput {
  kbId: string; // Knowledge base ID
  title: string;
  content: string;
  lng: string; // Default language
  description?: string;
  summary?: string;
  tags?: string[];
  categories?: string[];
  localizedContent?: IKBLocalizedContentInput[];
  attachments?: string[]; // File IDs
  metadata?: Record<string, any>;
  parentContent?: string; // For hierarchical content
  order?: number; // Order within parent
}

/**
 * Input type for updating an article
 */
export interface IUpdateArticleInput {
  title?: string;
  content?: string;
  lng?: string;
  description?: string;
  summary?: string;
  tags?: string[];
  categories?: string[];
  status?: KBArticleStatus;
  localizedContent?: IKBLocalizedContentInput[];
  metadata?: Record<string, any>;
  parentContent?: string;
  order?: number;
}

/**
 * Input type for localized content
 */
export interface IKBLocalizedContentInput {
  lng: string;
  title: string;
  content: string;
  summary?: string;
  description?: string;
  published?: boolean;
}

/**
 * Permission input type
 */
export interface IKBPermissionInput {
  userId: string;
  permission: KBPermissionLevel;
}

/**
 * Permission levels for content access
 */
export enum KBPermissionLevel {
  OWNER = 'owner',
  ADMIN = 'admin',
  WRITER = 'writer',
  READER = 'reader',
}

/**
 * Permission record
 */
export interface IKBPermission {
  id: string;
  contentId: string;
  userId: string;
  permission: KBPermissionLevel;
  grantedBy: string;
  grantedAt: Date;
}

/**
 * Content activity record
 */
export interface IKBActivity {
  id: string;
  contentId: string;
  userId: string;
  action: KBActivityAction;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Activity action types
 */
export enum KBActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  VIEWED = 'viewed',
  COMMENTED = 'commented',
  BOOKMARKED = 'bookmarked',
  SHARED = 'shared',
}

/**
 * Export all types
 */
export type KBContent = IKBContent;
export type KBLocalizedContent = IKBLocalizedContent;
export type KBStats = IKBStats;
export type KBFilter = IKBFilter;
export type ArticleFilter = IArticleFilter;
export type CreateKBInput = ICreateKBInput;
export type UpdateKBInput = IUpdateKBInput;
export type CreateArticleInput = ICreateArticleInput;
export type UpdateArticleInput = IUpdateArticleInput;
export type KBLocalizedContentInput = IKBLocalizedContentInput;
export type KBPermissionInput = IKBPermissionInput;
export type KBPermission = IKBPermission;
export type KBActivity = IKBActivity;

