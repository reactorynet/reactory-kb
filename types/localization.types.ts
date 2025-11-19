/**
 * Reactory Knowledge Base - Localization Type Definitions
 * 
 * This file contains types for multi-language support,
 * translation management, and localization workflows.
 */

import { ObjectId } from 'mongoose';

/**
 * Supported languages with metadata
 */
export interface IKBLanguage {
  code: string; // ISO 639-1 code (e.g., 'en', 'fr')
  name: string; // Language name (e.g., 'English', 'Français')
  nativeName: string; // Language name in native script
  direction: 'ltr' | 'rtl'; // Text direction
  enabled: boolean;
  fallback?: string; // Fallback language code
}

/**
 * Language fallback chain
 * e.g., fr-CA → fr → en
 */
export interface ILanguageFallbackChain {
  language: string;
  fallbacks: string[];
}

/**
 * Translation status for content
 */
export interface ITranslationStatus {
  contentId: string;
  defaultLanguage: string;
  availableLanguages: string[];
  missingLanguages: string[];
  translationCompleteness: Record<string, number>; // Percentage complete per language
  lastUpdated: Record<string, Date>; // Last update per language
}

/**
 * Translation request
 */
export interface ITranslationRequest {
  id: string;
  contentId: string;
  sourceLanguage: string;
  targetLanguage: string;
  requestedBy: string | ObjectId;
  requestedAt: Date;
  status: TranslationRequestStatus;
  assignedTo?: string | ObjectId;
  completedAt?: Date;
  completedBy?: string | ObjectId;
  priority: TranslationPriority;
  deadline?: Date;
  notes?: string;
}

/**
 * Translation request status
 */
export enum TranslationRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Translation priority
 */
export enum TranslationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Translation quality score
 */
export interface ITranslationQuality {
  contentId: string;
  language: string;
  qualityScore: number; // 0-100
  accuracy: number; // 0-100
  fluency: number; // 0-100
  completeness: number; // 0-100
  reviewedBy?: string | ObjectId;
  reviewedAt?: Date;
  feedback?: string;
}

/**
 * Localization workflow step
 */
export interface ILocalizationWorkflowStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignedTo?: string | ObjectId;
  startedAt?: Date;
  completedAt?: Date;
  order: number;
}

/**
 * Localization workflow
 */
export interface ILocalizationWorkflow {
  id: string;
  contentId: string;
  targetLanguages: string[];
  steps: ILocalizationWorkflowStep[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdBy: string | ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Translation memory entry
 * Stores previously translated segments for reuse
 */
export interface ITranslationMemoryEntry {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  targetText: string;
  context?: string;
  domain?: string;
  usageCount: number;
  quality?: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | ObjectId;
}

/**
 * Terminology entry for consistent translations
 */
export interface ITerminologyEntry {
  id: string;
  term: string;
  language: string;
  definition?: string;
  translations: Record<string, string>; // language -> translation
  domain?: string;
  tags?: string[];
  approved: boolean;
  approvedBy?: string | ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Localization preferences for a user
 */
export interface ILocalizationPreferences {
  userId: string | ObjectId;
  preferredLanguage: string;
  fallbackLanguages: string[];
  automaticTranslation?: boolean;
  showOriginalWithTranslation?: boolean;
  dateFormat?: string;
  numberFormat?: string;
  timezone?: string;
}

/**
 * Content localization metadata
 */
export interface IContentLocalizationMetadata {
  contentId: string;
  translatable: boolean;
  excludedFields?: string[]; // Fields that should not be translated
  customFields?: ILocalizableCustomField[];
  variableFormat?: 'curly' | 'square' | 'angle'; // {var}, [var], <var>
  preserveFormatting?: boolean;
  allowMachineTranslation?: boolean;
}

/**
 * Localizable custom field
 */
export interface ILocalizableCustomField {
  fieldName: string;
  fieldType: 'text' | 'html' | 'markdown';
  translatable: boolean;
  required: boolean;
}

/**
 * Translation export options
 */
export interface ITranslationExportOptions {
  contentId?: string;
  knowledgeBaseId?: string;
  sourceLanguage: string;
  targetLanguages: string[];
  format: 'xliff' | 'po' | 'json' | 'csv';
  includeMetadata?: boolean;
  includeContext?: boolean;
}

/**
 * Translation import options
 */
export interface ITranslationImportOptions {
  contentId?: string;
  knowledgeBaseId?: string;
  sourceLanguage: string;
  targetLanguage: string;
  format: 'xliff' | 'po' | 'json' | 'csv';
  overwrite?: boolean;
  validateBeforeImport?: boolean;
  autoPublish?: boolean;
}

/**
 * Machine translation configuration
 */
export interface IMachineTranslationConfig {
  personaId: string;
  customConfig: {
   provider: 'google' | 'deepl' | 'azure' | 'amazon' | 'custom' | 'grok';
   apiKey?: string;
   endpoint?: string;
   model?: string;
  },  
  enabled: boolean;
  autoTranslate?: boolean;
  qualityThreshold?: number; // Minimum quality score to accept
  supportedLanguages: string[];
}

/**
 * Translation suggestion
 */
export interface ITranslationSuggestion {
  sourceText: string;
  targetLanguage: string;
  suggestions: Array<{
    text: string;
    confidence: number;
    source: 'memory' | 'terminology' | 'machine' | 'human';
    metadata?: Record<string, any>;
  }>;
}

/**
 * Language statistics for a knowledge base
 */
export interface IKBLanguageStats {
  knowledgeBaseId: string;
  languages: Array<{
    code: string;
    name: string;
    totalContent: number;
    publishedContent: number;
    completeness: number; // Percentage
    lastUpdated: Date;
  }>;
  translationCoverage: number; // Overall percentage
  generatedAt: Date;
}

/**
 * Export all types
 */
export type KBLanguage = IKBLanguage;
export type LanguageFallbackChain = ILanguageFallbackChain;
export type TranslationStatus = ITranslationStatus;
export type TranslationRequest = ITranslationRequest;
export type TranslationQuality = ITranslationQuality;
export type LocalizationWorkflowStep = ILocalizationWorkflowStep;
export type LocalizationWorkflow = ILocalizationWorkflow;
export type TranslationMemoryEntry = ITranslationMemoryEntry;
export type TerminologyEntry = ITerminologyEntry;
export type LocalizationPreferences = ILocalizationPreferences;
export type ContentLocalizationMetadata = IContentLocalizationMetadata;
export type LocalizableCustomField = ILocalizableCustomField;
export type TranslationExportOptions = ITranslationExportOptions;
export type TranslationImportOptions = ITranslationImportOptions;
export type MachineTranslationConfig = IMachineTranslationConfig;
export type TranslationSuggestion = ITranslationSuggestion;
export type KBLanguageStats = IKBLanguageStats;

