/**
 * Knowledge Base AI Module
 * 
 * Export AI components for the Knowledge Base module
 */

import { KB_MACROS } from './macros';
import { KnowledgeBasePersona } from './persona/KnowledgeBasePersona';

export { KB_MACROS, KnowledgeBasePersona };

export default {
  macros: KB_MACROS,
  persona: KnowledgeBasePersona,
};

