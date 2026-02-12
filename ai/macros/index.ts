/**
 * Knowledge Base AI Macros
 * 
 * Export all AI macros for the Knowledge Base module
 */

import CreateKnowledgeBaseMacro from './CreateKnowledgeBaseMacro';
import GetKnowledgeBaseMacro from './GetKnowledgeBaseMacro';
import ListKnowledgeBasesMacro from './ListKnowledgeBasesMacro';
import CreateArticleMacro from './CreateArticleMacro';
import SearchArticlesMacro from './SearchArticlesMacro';
import GetKnowledgeContextMacro from './GetKnowledgeContextMacro';

/**
 * All KB Macros
 */
export const KB_MACROS = [
  // Knowledge Base Management
  CreateKnowledgeBaseMacro,
  GetKnowledgeBaseMacro,
  ListKnowledgeBasesMacro,
  
  // Article Management
  CreateArticleMacro,
  SearchArticlesMacro,
  
  // AI Knowledge Retrieval
  GetKnowledgeContextMacro,
];

/**
 * Export individual macros
 */
export {
  CreateKnowledgeBaseMacro,
  GetKnowledgeBaseMacro,
  ListKnowledgeBasesMacro,
  CreateArticleMacro,
  SearchArticlesMacro,
  GetKnowledgeContextMacro,
};

export default KB_MACROS;

