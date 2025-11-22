/**
 * Knowledge Base GraphQL Types
 * 
 * Loads GraphQL type definitions from .graphql files
 */

import { loadGraphQLTypeDefinitions } from '@reactory/server-core/graph/graphql-loader';

const KBTypeDefinitions = loadGraphQLTypeDefinitions([
  'KB/Enums',
  'KB/Types',
  'KB/Inputs',
  'KB/Queries',
  'KB/Mutations',
], __dirname, 'KnowledgeBase');

export default KBTypeDefinitions;
