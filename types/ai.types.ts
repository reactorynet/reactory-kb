/**
 * Reactory Knowledge Base - AI Integration Type Definitions
 * 
 * This file contains types for AI agent integration,
 * macros, and AI-enhanced knowledge management.
 */

import Reactory from '@reactorynet/reactory-core';
import { IKBContent, KBContentType, KBArticleStatus } from './kb.types';
import { IKBSearchQuery } from './search.types';

/**
 * AI knowledge context
 * Formatted knowledge for AI consumption
 */
export interface IAIKnowledgeContext {
  query: string;
  content: IAIContentSummary[];
  relatedTopics: string[];
  knowledgeGaps: string[];
  confidence: number; // 0-1
  localizedVersions: ILocalizedContext[];
  sources: string[]; // Content IDs used
  generatedAt: Date;
}

/**
 * AI content summary
 * Condensed content representation for AI
 */
export interface IAIContentSummary {
  id: string;
  contentType: KBContentType;
  title: string;
  summary: string;
  relevanceScore: number; // 0-1
  keyPoints: string[];
  categories: string[];
  tags: string[];
  lng: string;
  localizedVersions: string[]; // Available languages
  metadata?: Record<string, any>;
}

/**
 * Localized context for AI
 */
export interface ILocalizedContext {
  lng: string;
  availableContent: string[]; // Content IDs
  missingTranslations: string[]; // Content IDs without this language
}

/**
 * AI article creation input
 */
export interface IAICreateArticleInput {
  knowledgeBaseId: string;
  title: string;
  content: string;
  lng: string;
  description?: string;
  summary?: string;
  tags?: string[];
  categories?: string[];
  metadata: IAIGenerationMetadata;
}

/**
 * AI generation metadata
 * Tracks AI-generated content
 */
export interface IAIGenerationMetadata {
  generatedBy: string; // AI agent/model ID
  modelVersion?: string;
  confidence: number; // 0-1
  sources?: string[]; // Source content IDs
  prompt?: string;
  generatedAt: Date;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  approved: boolean;
}

/**
 * AI content validation result
 */
export interface IAIContentValidation {
  valid: boolean;
  confidence: number; // 0-1
  issues: IAIValidationIssue[];
  suggestions: string[];
  score: IAIQualityScore;
}

/**
 * AI validation issue
 */
export interface IAIValidationIssue {
  type: 'factual' | 'grammatical' | 'structural' | 'stylistic' | 'citation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: {
    start: number;
    end: number;
  };
  suggestion?: string;
}

/**
 * AI quality score
 */
export interface IAIQualityScore {
  overall: number; // 0-100
  accuracy: number; // 0-100
  completeness: number; // 0-100
  clarity: number; // 0-100
  relevance: number; // 0-100
  coherence: number; // 0-100
}

/**
 * AI macro tool definition
 * Defines an AI tool/macro for LLM
 */
export interface IAIMacroToolDefinition {
  name: string;
  description: string;
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, IAIMacroParameter>;
      required: string[];
    };
  };
  roles: string[]; // Required user roles
  runat: 'server' | 'client';
}

/**
 * AI macro parameter
 */
export interface IAIMacroParameter {
  type: string;
  description: string;
  enum?: string[];
  default?: any;
  items?: IAIMacroParameter; // For array types
  properties?: Record<string, IAIMacroParameter>; // For object types
}

/**
 * AI persona configuration
 */
export interface IAIPersonaConfig {
  id: string;
  name: string;
  description: string;
  modelId: string;
  providerId: string;
  tools: IAIMacroToolDefinition[];
  macros: IAIMacroToolDefinition[];
  resources: IAIResource[];
  prompts: {
    system: {
      content: string;
      role: 'system';
    };
    user?: {
      content: string;
      role: 'user';
    };
  };
  settings?: IAIPersonaSettings;
}

/**
 * AI persona settings
 */
export interface IAIPersonaSettings {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * AI resource
 * Knowledge resources available to AI
 */
export interface IAIResource {
  id: string;
  type: 'knowledge-base' | 'document' | 'api' | 'database';
  name: string;
  description: string;
  endpoint?: string;
  parameters?: Record<string, any>;
  cache?: boolean;
  cacheTTL?: number;
}

/**
 * AI macro execution context
 */
export interface IAIMacroContext {
  userId: string;
  roles: string[];
  permissions: string[];
  knowledgeBaseAccess: string[]; // KB IDs user has access to
  preferredLanguage?: string;
  metadata?: Record<string, any>;
}

/**
 * AI macro execution result
 */
export interface IAIMacroResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    cached?: boolean;
  };
}

/**
 * AI learning workflow state
 */
export interface IAILearningWorkflowState {
  workflowId: string;
  knowledgeBaseId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep: string;
  stepsCompleted: string[];
  articlesProcessed: number;
  totalArticles: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * AI content enhancement suggestion
 */
export interface IAIContentEnhancement {
  contentId: string;
  type: 'expansion' | 'clarification' | 'examples' | 'links' | 'images' | 'restructure';
  suggestion: string;
  confidence: number; // 0-1
  rationale: string;
  applicableLanguages?: string[];
  priority: 'low' | 'medium' | 'high';
}

/**
 * AI knowledge gap analysis
 */
export interface IAIKnowledgeGapAnalysis {
  knowledgeBaseId: string;
  gaps: Array<{
    topic: string;
    description: string;
    relatedContent: string[]; // Related article IDs
    priority: number; // 0-1
    suggestedContent?: string;
    keywords: string[];
  }>;
  missingTranslations: Array<{
    articleId: string;
    missingLanguages: string[];
    priority: number;
  }>;
  outdatedContent: Array<{
    articleId: string;
    lastUpdated: Date;
    reasonForFlag: string;
  }>;
  analyzedAt: Date;
}

/**
 * AI content recommendation
 */
export interface IAIContentRecommendation {
  userId?: string;
  context?: string;
  recommendations: Array<{
    contentId: string;
    title: string;
    summary: string;
    score: number; // 0-1
    reason: string;
    tags: string[];
  }>;
  generatedAt: Date;
}

/**
 * AI translation job
 */
export interface IAITranslationJob {
  id: string;
  contentId: string;
  sourceLanguage: string;
  targetLanguages: string[];
  status: 'pending' | 'processing' | 'review' | 'completed' | 'failed';
  progress: number; // 0-100
  provider: string; // AI model/service used
  qualityScore?: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: IAIGenerationMetadata;
}

/**
 * AI summarization request
 */
export interface IAISummarizationRequest {
  contentId: string;
  maxLength?: number; // Max words/characters
  style?: 'brief' | 'detailed' | 'technical' | 'simple';
  language?: string;
  format?: 'plain' | 'bullets' | 'markdown';
}

/**
 * AI summarization result
 */
export interface IAISummarizationResult {
  contentId: string;
  summary: string;
  keyPoints: string[];
  wordCount: number;
  generatedBy: string;
  confidence: number;
  metadata?: IAIGenerationMetadata;
}

/**
 * Export all types
 */
export type AIKnowledgeContext = IAIKnowledgeContext;
export type AIContentSummary = IAIContentSummary;
export type LocalizedContext = ILocalizedContext;
export type AICreateArticleInput = IAICreateArticleInput;
export type AIGenerationMetadata = IAIGenerationMetadata;
export type AIContentValidation = IAIContentValidation;
export type AIValidationIssue = IAIValidationIssue;
export type AIQualityScore = IAIQualityScore;
export type AIMacroToolDefinition = IAIMacroToolDefinition;
export type AIMacroParameter = IAIMacroParameter;
export type AIPersonaConfig = IAIPersonaConfig;
export type AIPersonaSettings = IAIPersonaSettings;
export type AIResource = IAIResource;
export type AIMacroContext = IAIMacroContext;
export type AIMacroResult = IAIMacroResult;
export type AILearningWorkflowState = IAILearningWorkflowState;
export type AIContentEnhancement = IAIContentEnhancement;
export type AIKnowledgeGapAnalysis = IAIKnowledgeGapAnalysis;
export type AIContentRecommendation = IAIContentRecommendation;
export type AITranslationJob = IAITranslationJob;
export type AISummarizationRequest = IAISummarizationRequest;
export type AISummarizationResult = IAISummarizationResult;

