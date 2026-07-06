/**
 * Knowledge Base AI Module
 * 
 * Export AI components for the Knowledge Base module
 */

import { KB_MACROS, KB_TOOLS } from './macros';
import { KnowledgeBasePersona } from './persona/KnowledgeBasePersona';

export { KB_MACROS, KB_TOOLS, KnowledgeBasePersona };

export default {
  macros: KB_MACROS,
  tools: KB_TOOLS,
  persona: KnowledgeBasePersona,
};

