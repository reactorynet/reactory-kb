import Reactory from '@reactory/reactory-core';

/**
 * Knowledge Base Services
 * 
 * Core business logic services for knowledge base operations:
 * - KnowledgeBaseService: Manage KB entities
 * - ArticleService: Manage articles
 * - CategoryService: Manage categories
 * - SearchService: Full-text search
 * - CollaborationService: Multi-user features
 * - PermissionService: Access control
 * - LocalizationService: Multi-language support (TODO)
 * - AIIntegrationService: AI agent interactions (TODO)
 */

import KnowledgeBaseService from './KnowledgeBaseService';
import ArticleService from './ArticleService';
import CategoryService from './CategoryService';
import SearchService from './SearchService';
import CollaborationService from './CollaborationService';
import PermissionService from './PermissionService';
import LocalizationService from './LocalizationService';
import AIIntegrationService from './AIIntegrationService';

const services: Reactory.Service.IReactoryService[] = [
  KnowledgeBaseService.reactory,
  ArticleService.reactory,
  CategoryService.reactory,
  SearchService.reactory,
  CollaborationService.reactory,
  PermissionService.reactory,
  LocalizationService.reactory,
  AIIntegrationService.reactory,
];

export default services;
export {
  KnowledgeBaseService,
  ArticleService,
  CategoryService,
  SearchService,
  CollaborationService,
  PermissionService,
  LocalizationService,
  AIIntegrationService,
};
