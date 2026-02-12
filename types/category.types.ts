/**
 * Reactory Knowledge Base - Category Type Definitions
 * 
 * This file contains types for hierarchical category management
 * and article organization.
 */

import { ObjectId } from 'mongoose';
import { IKBContent } from './kb.types';

/**
 * Category with hierarchy information
 */
export interface IKBCategory extends IKBContent {
  parentCategory?: string | ObjectId; // Parent category ID
  childCategories?: string[] | ObjectId[]; // Child category IDs
  level: number; // Depth level in hierarchy (0 = root)
  path: string[]; // Full path from root (e.g., ['tech', 'programming', 'javascript'])
  order: number; // Display order within parent
  articleCount?: number; // Number of articles in this category
  icon?: string; // Icon name or URL
  color?: string; // Color code for UI
  metadata?: ICategoryMetadata;
}

/**
 * Category metadata
 */
export interface ICategoryMetadata {
  featuredArticles?: string[]; // Featured article IDs
  relatedCategories?: string[]; // Related category IDs
  seoTitle?: string;
  seoDescription?: string;
  customFields?: Record<string, any>;
}

/**
 * Category tree node
 * Used for rendering hierarchical category lists
 */
export interface ICategoryTreeNode {
  category: IKBCategory;
  children: ICategoryTreeNode[];
  expanded?: boolean;
  selected?: boolean;
}

/**
 * Category statistics
 */
export interface ICategoryStats {
  categoryId: string;
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalComments: number;
  subcategoryCount: number;
  topContributors: Array<{
    userId: string;
    articleCount: number;
  }>;
  lastUpdated: Date;
}

/**
 * Category filter options
 */
export interface ICategoryFilter {
  parentId?: string;
  level?: number;
  hasArticles?: boolean;
  searchQuery?: string;
  sortBy?: 'name' | 'articleCount' | 'order' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Category move options
 * For reorganizing category hierarchy
 */
export interface ICategoryMoveOptions {
  categoryId: string;
  newParentId?: string; // null/undefined means move to root
  newOrder?: number;
  preserveSubcategories?: boolean;
  updatePaths?: boolean;
}

/**
 * Category merge options
 * For combining categories
 */
export interface ICategoryMergeOptions {
  sourceCategoryId: string;
  targetCategoryId: string;
  deleteSource?: boolean;
  moveArticles?: boolean;
  mergeSubcategories?: boolean;
}

/**
 * Category split options
 * For splitting a category into multiple
 */
export interface ICategorySplitOptions {
  sourceCategoryId: string;
  newCategories: Array<{
    name: string;
    description?: string;
    articleIds?: string[];
  }>;
  deleteSource?: boolean;
}

/**
 * Category path breadcrumb
 */
export interface ICategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
  level: number;
}

/**
 * Category assignment for article
 */
export interface ICategoryAssignment {
  articleId: string;
  categoryIds: string[];
  primary?: string; // Primary category ID
  assignedBy: string | ObjectId;
  assignedAt: Date;
}

/**
 * Category template
 * Pre-defined category structures
 */
export interface ICategoryTemplate {
  id: string;
  name: string;
  description?: string;
  structure: ICategoryTemplateNode[];
  metadata?: Record<string, any>;
}

/**
 * Category template node
 */
export interface ICategoryTemplateNode {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  children?: ICategoryTemplateNode[];
  metadata?: Record<string, any>;
}

/**
 * Category import/export format
 */
export interface ICategoryExport {
  categories: Array<{
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    level: number;
    order: number;
    path: string[];
    metadata?: Record<string, any>;
  }>;
  relationships: Array<{
    parentId: string;
    childIds: string[];
  }>;
  exportedAt: Date;
  version: string;
}

/**
 * Category suggestions for article
 * Auto-suggest categories based on content
 */
export interface ICategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-1
  reason: string;
  keywords: string[];
}

/**
 * Category access control
 */
export interface ICategoryAccess {
  categoryId: string;
  allowedRoles?: string[];
  allowedUsers?: string[];
  restrictedUsers?: string[];
  inheritFromParent?: boolean;
}

/**
 * Category bulk operation result
 */
export interface ICategoryBulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    categoryId: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Category validation result
 */
export interface ICategoryValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Export all types
 */
export type KBCategory = IKBCategory;
export type CategoryMetadata = ICategoryMetadata;
export type CategoryTreeNode = ICategoryTreeNode;
export type CategoryStats = ICategoryStats;
export type CategoryFilter = ICategoryFilter;
export type CategoryMoveOptions = ICategoryMoveOptions;
export type CategoryMergeOptions = ICategoryMergeOptions;
export type CategorySplitOptions = ICategorySplitOptions;
export type CategoryBreadcrumb = ICategoryBreadcrumb;
export type CategoryAssignment = ICategoryAssignment;
export type CategoryTemplate = ICategoryTemplate;
export type CategoryTemplateNode = ICategoryTemplateNode;
export type CategoryExport = ICategoryExport;
export type CategorySuggestion = ICategorySuggestion;
export type CategoryAccess = ICategoryAccess;
export type CategoryBulkOperationResult = ICategoryBulkOperationResult;
export type CategoryValidationResult = ICategoryValidationResult;

