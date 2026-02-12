/**
 * Reactory Knowledge Base - Article Type Definitions
 * 
 * This file contains types specific to article management,
 * versioning, and article-specific operations.
 */

import { ObjectId } from 'mongoose';
import Reactory from '@reactory/reactory-core';
import { KBArticleStatus, IKBContent } from './kb.types';

/**
 * Article version record
 * Tracks changes to articles over time
 */
export interface IArticleVersion {
  id: string;
  articleId: string | ObjectId;
  versionNumber: number;
  title: string;
  content: string;
  summary?: string;
  description?: string;
  changeSummary?: string; // Description of what changed
  author: string | ObjectId;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Article version comparison result
 */
export interface IArticleVersionComparison {
  versionA: IArticleVersion;
  versionB: IArticleVersion;
  differences: IVersionDifference[];
}

/**
 * Version difference details
 */
export interface IVersionDifference {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
}

/**
 * Article draft
 * Used for saving work-in-progress content
 */
export interface IArticleDraft {
  id: string;
  articleId?: string | ObjectId;
  knowledgeBaseId: string | ObjectId;
  title: string;
  content: string;
  summary?: string;
  description?: string;
  tags?: string[];
  categories?: string[];
  author: string | ObjectId;
  lastSaved: Date;
  metadata?: Record<string, any>;
}

/**
 * Article revision request
 * When an article is sent back for revisions
 */
export interface IArticleRevisionRequest {
  id: string;
  articleId: string | ObjectId;
  requestedBy: string | ObjectId;
  requestedAt: Date;
  reason: string;
  comments?: string[];
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string | ObjectId;
}

/**
 * Article approval record
 */
export interface IArticleApproval {
  id: string;
  articleId: string | ObjectId;
  approver: string | ObjectId;
  approved: boolean;
  approvedAt: Date;
  comments?: string;
  metadata?: Record<string, any>;
}

/**
 * Article publishing options
 */
export interface IArticlePublishOptions {
  publishDate?: Date; // Schedule publication
  notifySubscribers?: boolean;
  notificationMessage?: string;
  publishToLanguages?: string[]; // Which languages to publish
  metadata?: Record<string, any>;
}

/**
 * Article archive options
 */
export interface IArticleArchiveOptions {
  archiveDate?: Date;
  reason?: string;
  redirectTo?: string; // Redirect URL
  notifyAuthor?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Article restoration options
 */
export interface IArticleRestoreOptions {
  restoreVersion?: number; // Which version to restore to
  preserveHistory?: boolean;
  notifyAuthor?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Article search result with highlighting
 */
export interface IArticleSearchResult {
  article: IKBContent;
  score: number;
  highlights: ISearchHighlight[];
  matchedLanguages: string[];
}

/**
 * Search highlight details
 */
export interface ISearchHighlight {
  field: string;
  snippet: string;
  position: number;
}

/**
 * Article metadata
 */
export interface IArticleMetadata {
  wordCount?: number;
  readingTime?: number; // In minutes
  lastReviewedAt?: Date;
  lastReviewedBy?: string | ObjectId;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  featured?: boolean;
  featuredUntil?: Date;
  relatedArticles?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadingTime?: number;
  customFields?: Record<string, any>;
}

/**
 * Article template
 * Predefined structure for articles
 */
export interface IArticleTemplate {
  id: string;
  name: string;
  description?: string;
  content: string; // Template content with placeholders
  lng: string;
  sections: IArticleTemplateSection[];
  customFields?: IArticleTemplateField[];
  metadata?: Record<string, any>;
}

/**
 * Article template section
 */
export interface IArticleTemplateSection {
  id: string;
  name: string;
  description?: string;
  content: string;
  order: number;
  required: boolean;
}

/**
 * Article template custom field
 */
export interface IArticleTemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select/multiselect
  validation?: string; // Validation rules
}

/**
 * Article quality score
 */
export interface IArticleQualityScore {
  articleId: string;
  overallScore: number; // 0-100
  completeness: number; // 0-100
  readability: number; // 0-100
  seoScore: number; // 0-100
  freshness: number; // 0-100
  engagement: number; // 0-100
  calculatedAt: Date;
  recommendations: string[];
}

/**
 * Article engagement metrics
 */
export interface IArticleEngagement {
  articleId: string;
  views: number;
  uniqueViews: number;
  averageTimeSpent: number; // In seconds
  bookmarks: number;
  shares: number;
  comments: number;
  likes: number;
  dislikes: number;
  feedbackScore: number; // Average user feedback
  period?: {
    start: Date;
    end: Date;
  };
}

/**
 * Article export options
 */
export interface IArticleExportOptions {
  format: 'markdown' | 'html' | 'pdf' | 'docx' | 'json';
  includeMetadata?: boolean;
  includeComments?: boolean;
  includeVersionHistory?: boolean;
  language?: string; // Export specific language
  template?: string; // Custom export template
}

/**
 * Article import options
 */
export interface IArticleImportOptions {
  sourceFormat: 'markdown' | 'html' | 'docx' | 'json';
  knowledgeBaseId: string;
  language: string;
  autoPublish?: boolean;
  preserveMetadata?: boolean;
  conflictResolution?: 'skip' | 'overwrite' | 'merge';
}

/**
 * Batch article operation result
 */
export interface IBatchArticleOperationResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    articleId: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Export all types
 */
export type ArticleVersion = IArticleVersion;
export type ArticleVersionComparison = IArticleVersionComparison;
export type VersionDifference = IVersionDifference;
export type ArticleDraft = IArticleDraft;
export type ArticleRevisionRequest = IArticleRevisionRequest;
export type ArticleApproval = IArticleApproval;
export type ArticlePublishOptions = IArticlePublishOptions;
export type ArticleArchiveOptions = IArticleArchiveOptions;
export type ArticleRestoreOptions = IArticleRestoreOptions;
export type ArticleSearchResult = IArticleSearchResult;
export type SearchHighlight = ISearchHighlight;
export type ArticleMetadata = IArticleMetadata;
export type ArticleTemplate = IArticleTemplate;
export type ArticleTemplateSection = IArticleTemplateSection;
export type ArticleTemplateField = IArticleTemplateField;
export type ArticleQualityScore = IArticleQualityScore;
export type ArticleEngagement = IArticleEngagement;
export type ArticleExportOptions = IArticleExportOptions;
export type ArticleImportOptions = IArticleImportOptions;
export type BatchArticleOperationResult = IBatchArticleOperationResult;

