/**
 * Reactory Knowledge Base - Type Definitions Index
 * 
 * Central export point for all KB type definitions
 */

// Core KB types
export * from './kb.types';

// Article types
export * from './article.types';

// Localization types
export * from './localization.types';

// Category types
export * from './category.types';

// Permission types
export * from './permission.types';

// Search types
export * from './search.types';

// AI Integration types
export * from './ai.types';

/**
 * Re-export commonly used types with shorter aliases
 */
export type {
  IKBContent as KBContent,
  IKBLocalizedContent as KBLocalizedContent,
  IKBStats as KBStats,
  IKBFilter as KBFilter,
  IArticleFilter as ArticleFilter,
  ICreateKBInput as CreateKBInput,
  IUpdateKBInput as UpdateKBInput,
  ICreateArticleInput as CreateArticleInput,
  IUpdateArticleInput as UpdateArticleInput,
  IKBPermission as KBPermission,
  IKBActivity as KBActivity,
} from './kb.types';

export type {
  IArticleVersion as ArticleVersion,
  IArticleDraft as ArticleDraft,
  IArticleMetadata as ArticleMetadata,
  IArticleTemplate as ArticleTemplate,
} from './article.types';

export type {
  IKBLanguage as KBLanguage,
  ITranslationRequest as TranslationRequest,
  ITranslationStatus as TranslationStatus,
} from './localization.types';

export type {
  IKBCategory as KBCategory,
  ICategoryTreeNode as CategoryTreeNode,
  ICategoryStats as CategoryStats,
} from './category.types';

export type {
  IPermissionGrant as PermissionGrant,
  IPermissionCheckResult as PermissionCheckResult,
  IVisibilitySettings as VisibilitySettings,
  IAccessRequest as AccessRequest,
  ISharingLink as SharingLink,
} from './permission.types';

export type {
  IKBSearchQuery as KBSearchQuery,
  IKBSearchResult as KBSearchResult,
  IKBSearchFilters as KBSearchFilters,
  IKBSearchSuggestions as KBSearchSuggestions,
} from './search.types';

export type {
  IAIKnowledgeContext as AIKnowledgeContext,
  IAIContentSummary as AIContentSummary,
  IAICreateArticleInput as AICreateArticleInput,
  IAIContentValidation as AIContentValidation,
  IAIMacroToolDefinition as AIMacroToolDefinition,
  IAIPersonaConfig as AIPersonaConfig,
} from './ai.types';

/**
 * Export enums for direct use
 */
export {
  KBContentType,
  KBVisibility,
  KBArticleStatus,
  KBPermissionLevel,
  KBActivityAction,
} from './kb.types';

export {
  TranslationRequestStatus,
  TranslationPriority,
} from './localization.types';

export {
  AccessRequestStatus,
  PermissionAuditAction,
} from './permission.types';

