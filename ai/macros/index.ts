/**
 * Knowledge Base AI Macros
 *
 * Export all AI macros for the Knowledge Base module. Each macro conforms to the
 * standard reactor macro/tool implementation — a `MacroComponentDefinition` with
 * a `component` function — so they are registered by `ReactorMacroService` and
 * exposed to personas as tools.
 */

import { MacroComponentDefinition, MacroToolDefinition } from '@reactory/server-modules/reactory-reactor/ai/openai/types/chat';
import CreateKnowledgeBaseMacroDefinition from './CreateKnowledgeBaseMacro';
import GetKnowledgeBaseMacroDefinition from './GetKnowledgeBaseMacro';
import ListKnowledgeBasesMacroDefinition from './ListKnowledgeBasesMacro';
import CreateArticleMacroDefinition from './CreateArticleMacro';
import SearchArticlesMacroDefinition from './SearchArticlesMacro';
import GetKnowledgeContextMacroDefinition from './GetKnowledgeContextMacro';

/**
 * All KB macro definitions (MacroComponentDefinition[]).
 */
export const KB_MACROS: MacroComponentDefinition<unknown>[] = [
  // Knowledge Base Management
  CreateKnowledgeBaseMacroDefinition,
  GetKnowledgeBaseMacroDefinition,
  ListKnowledgeBasesMacroDefinition,

  // Article Management
  CreateArticleMacroDefinition,
  SearchArticlesMacroDefinition,

  // AI Knowledge Retrieval
  GetKnowledgeContextMacroDefinition,
];

/**
 * Flattened tool definitions contributed by the KB macros. Personas expose
 * these as their callable tools (`MacroToolDefinition[]`).
 */
export const KB_TOOLS: MacroToolDefinition[] = KB_MACROS.flatMap(
  (macro) => macro.tools ?? [],
);

/**
 * Export individual macro definitions
 */
export {
  CreateKnowledgeBaseMacroDefinition,
  GetKnowledgeBaseMacroDefinition,
  ListKnowledgeBasesMacroDefinition,
  CreateArticleMacroDefinition,
  SearchArticlesMacroDefinition,
  GetKnowledgeContextMacroDefinition,
};

export default KB_MACROS;
