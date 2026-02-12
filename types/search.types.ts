/**
 * Reactory Knowledge Base - Search Type Definitions
 * 
 * This file contains types for search functionality,
 * indexing, and search result processing.
 */

import Reactory from '@reactory/reactory-core';
import { KBContentType, KBArticleStatus, IKBContent } from './kb.types';

/**
 * Search query with advanced options
 */
export interface IKBSearchQuery {
  query: string;
  filters?: IKBSearchFilters;
  facets?: string[]; // Fields to get facets for
  sortBy?: IKBSearchSort;
  highlight?: IKBSearchHighlight;
  limit?: number;
  offset?: number;
  includeLocalizations?: boolean; // Search in localized content
  fuzzy?: boolean; // Enable fuzzy matching
  proximity?: number; // Word proximity for phrase searches
}

/**
 * Search filters
 */
export interface IKBSearchFilters {
  contentType?: KBContentType | KBContentType[];
  knowledgeBaseId?: string | string[];
  status?: KBArticleStatus | KBArticleStatus[];
  authorId?: string | string[];
  tags?: string[];
  categories?: string[];
  lng?: string | string[];
  published?: boolean;
  dateRange?: IDateRange;
  customFields?: Record<string, any>;
}

/**
 * Date range filter
 */
export interface IDateRange {
  field: 'createdAt' | 'updatedAt' | 'publishedAt' | 'lastViewed';
  start?: Date;
  end?: Date;
}

/**
 * Search sort options
 */
export interface IKBSearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Search highlight configuration
 */
export interface IKBSearchHighlight {
  fields: string[];
  preTag?: string; // HTML tag before highlight (default: '<mark>')
  postTag?: string; // HTML tag after highlight (default: '</mark>')
  fragmentSize?: number; // Size of highlighted fragments
  numberOfFragments?: number; // Number of fragments to return
}

/**
 * Search result
 */
export interface IKBSearchResult<T = IKBContent> {
  query: string;
  total: number;
  limit: number;
  offset: number;
  took: number; // Time in milliseconds
  results: IKBSearchResultItem<T>[];
  facets?: IKBSearchFacets;
  suggestions?: string[]; // Query suggestions
  metadata?: Record<string, any>;
}

/**
 * Individual search result item
 */
export interface IKBSearchResultItem<T = IKBContent> {
  content: T;
  score: number; // Relevance score
  highlights?: Record<string, string[]>; // Field -> highlighted fragments
  matchedQueries?: string[]; // Which parts of query matched
  matchedLanguages?: string[]; // Which languages had matches
  explanation?: ISearchScoreExplanation;
}

/**
 * Search score explanation
 * Explains why a result has a certain score
 */
export interface ISearchScoreExplanation {
  value: number;
  description: string;
  details: Array<{
    value: number;
    description: string;
  }>;
}

/**
 * Search facets
 * Aggregated data for filtering
 */
export interface IKBSearchFacets {
  [facetName: string]: IKBSearchFacetResult;
}

/**
 * Individual facet result
 */
export interface IKBSearchFacetResult {
  field: string;
  values: Array<{
    value: string;
    count: number;
    selected?: boolean;
  }>;
}

/**
 * Search suggestions for autocomplete
 */
export interface IKBSearchSuggestions {
  query: string;
  suggestions: Array<{
    text: string;
    score: number;
    type: 'term' | 'phrase' | 'completion';
    category?: string;
  }>;
}

/**
 * Search index configuration
 */
export interface IKBSearchIndexConfig {
  indexName: string;
  primaryKey: string;
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes: string[];
  rankingRules?: string[];
  stopWords?: string[];
  synonyms?: Record<string, string[]>;
  typoTolerance?: boolean;
  minWordSizeForTypos?: {
    oneTypo: number;
    twoTypos: number;
  };
}

/**
 * Search indexing options
 */
export interface IKBSearchIndexingOptions {
  batchSize?: number;
  deleteBeforeIndex?: boolean;
  indexLocalizations?: boolean;
  indexMetadata?: boolean;
  customTransformers?: Array<(content: IKBContent) => Record<string, any>>;
}

/**
 * Search indexing result
 */
export interface IKBSearchIndexingResult {
  indexed: number;
  failed: number;
  errors: Array<{
    contentId: string;
    error: string;
  }>;
  duration: number; // In milliseconds
}

/**
 * Search analytics
 */
export interface IKBSearchAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalSearches: number;
  uniqueUsers: number;
  topQueries: Array<{
    query: string;
    count: number;
    avgResults: number;
    avgClickPosition: number;
  }>;
  zeroResultQueries: Array<{
    query: string;
    count: number;
  }>;
  avgResultsPerQuery: number;
  avgSearchTime: number; // In milliseconds
  clickThroughRate: number; // Percentage
}

/**
 * Search filter preset
 * Saved search filter configurations
 */
export interface IKBSearchFilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: IKBSearchFilters;
  sortBy?: IKBSearchSort;
  isPublic?: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount?: number;
}

/**
 * Saved search
 * Complete saved search configuration
 */
export interface IKBSavedSearch {
  id: string;
  name: string;
  description?: string;
  query: IKBSearchQuery;
  userId: string;
  notifications?: {
    enabled: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
    lastSent?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  resultCount?: number;
}

/**
 * Search re-indexing job
 */
export interface IKBReindexJob {
  id: string;
  knowledgeBaseId?: string; // If specific KB, otherwise all
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  progress: {
    total: number;
    processed: number;
    failed: number;
  };
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Search query parser result
 */
export interface IKBSearchQueryParsed {
  originalQuery: string;
  terms: string[];
  phrases: string[];
  operators: Array<{
    type: 'AND' | 'OR' | 'NOT';
    position: number;
  }>;
  fieldSpecific: Record<string, string>; // field:value pairs
  filters: IKBSearchFilters;
  fuzzy: boolean;
  wildcards: string[];
}

/**
 * Search result export options
 */
export interface IKBSearchExportOptions {
  format: 'csv' | 'json' | 'excel';
  fields?: string[];
  includeHighlights?: boolean;
  includeMetadata?: boolean;
  maxResults?: number;
}

/**
 * MeiliSearch specific configuration
 */
export interface IMeiliSearchConfig {
  host: string;
  apiKey: string;
  indexPrefix?: string;
  primaryKey?: string;
  distinctAttribute?: string;
  searchCutoffMs?: number;
}

/**
 * Export all types
 */
export type KBSearchQuery = IKBSearchQuery;
export type KBSearchFilters = IKBSearchFilters;
export type DateRange = IDateRange;
export type KBSearchSort = IKBSearchSort;
export type KBSearchHighlight = IKBSearchHighlight;
export type KBSearchResult<T = IKBContent> = IKBSearchResult<T>;
export type KBSearchResultItem<T = IKBContent> = IKBSearchResultItem<T>;
export type SearchScoreExplanation = ISearchScoreExplanation;
export type KBSearchFacets = IKBSearchFacets;
export type KBSearchFacetResult = IKBSearchFacetResult;
export type KBSearchSuggestions = IKBSearchSuggestions;
export type KBSearchIndexConfig = IKBSearchIndexConfig;
export type KBSearchIndexingOptions = IKBSearchIndexingOptions;
export type KBSearchIndexingResult = IKBSearchIndexingResult;
export type KBSearchAnalytics = IKBSearchAnalytics;
export type KBSearchFilterPreset = IKBSearchFilterPreset;
export type KBSavedSearch = IKBSavedSearch;
export type KBReindexJob = IKBReindexJob;
export type KBSearchQueryParsed = IKBSearchQueryParsed;
export type KBSearchExportOptions = IKBSearchExportOptions;
export type MeiliSearchConfig = IMeiliSearchConfig;

