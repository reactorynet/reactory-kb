/**
 * Get Knowledge Context Macro
 *
 * AI tool for retrieving contextual knowledge for a query. Conforms to the
 * standard reactor macro/tool implementation: a `component` function plus a
 * `MacroComponentDefinition` registry entry, resolving services from
 * `state.context.getService(...)`.
 */

import { ChatState, MacroComponentDefinition } from '@reactory/server-modules/reactory-reactor/ai/openai/types/chat';
import { IAIIntegrationService } from '@reactory/server-modules/reactory-kb/services/AIIntegrationService';

export interface GetKnowledgeContextMacroParams {
  /** The question or topic to get context for */
  query: string;
  /** Limit context to specific knowledge base */
  kbId?: string;
  /** Preferred language for content */
  language?: string;
}

const GetKnowledgeContextMacro = async (
  params: GetKnowledgeContextMacroParams,
  state: ChatState,
) => {
  const { context } = state;
  const { query, kbId } = params;

  if (!query) {
    return {
      success: false,
      error: 'query is required',
      tool: 'get_knowledge_context',
      params,
      instructions: `## Get Knowledge Context — Missing Parameter\n\n**query** is required.\n\n### Recovery Options:\n- Provide a question or topic and retry`,
    };
  }

  try {
    const aiService = context?.getService<IAIIntegrationService>('kb.AIIntegrationService@1.0.0');

    if (!aiService) {
      return {
        success: false,
        error: 'AIIntegrationService is not available',
        tool: 'get_knowledge_context',
        params,
        instructions: `## Get Knowledge Context — Service Unavailable\n\nThe AIIntegrationService is not registered.\n\n### Recovery Options:\n- Use \`svc\` with action="list" to check available services\n- Verify the reactory-kb module is loaded`,
      };
    }

    const knowledgeContext = await aiService.getKnowledgeContext(query, kbId);

    if (!state.vars) state.vars = {};
    state.vars.lastKnowledgeContext = knowledgeContext;

    return {
      success: true,
      data: {
        query: knowledgeContext.query,
        articles: knowledgeContext.content.map((article) => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          keyPoints: article.keyPoints,
          tags: article.tags,
          relevanceScore: article.relevanceScore,
        })),
        relatedTopics: knowledgeContext.relatedTopics,
        knowledgeGaps: knowledgeContext.knowledgeGaps,
        confidence: knowledgeContext.confidence,
        availableLanguages: knowledgeContext.localizedVersions.map((lv) => lv.lng),
      },
      tool: 'get_knowledge_context',
      params,
      message: `Retrieved knowledge context for "${query}" (confidence: ${(knowledgeContext.confidence * 100).toFixed(0)}%)`,
      instructions: `## Knowledge Context: "${query}"\n\nConfidence: **${(knowledgeContext.confidence * 100).toFixed(0)}%** | ${knowledgeContext.content.length} article(s) found\n\n### Top Articles:\n${knowledgeContext.content.slice(0, 5).map((a) => `- **${a.title}** (score: ${a.relevanceScore?.toFixed(2) || 'N/A'})`).join('\n')}\n\n${knowledgeContext.knowledgeGaps?.length ? `### Knowledge Gaps:\n${knowledgeContext.knowledgeGaps.map((g: string) => `- ${g}`).join('\n')}` : ''}\n\n### Suggested Next Steps:\n- Use the article data to form a comprehensive answer\n- Use \`search_kb_articles\` for more specific searches\n- Use \`create_kb_article\` to fill any knowledge gaps`,
    };
  } catch (error) {
    context?.error?.('Error retrieving knowledge context', { error, params }, 'GetKnowledgeContextMacro');
    return {
      success: false,
      error: `Failed to retrieve knowledge context: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'get_knowledge_context',
      params,
      instructions: `## Get Knowledge Context — Error\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n### Recovery Options:\n- Rephrase the query or scope it to a kbId and retry`,
    };
  }
};

export const GetKnowledgeContextMacroDefinition: MacroComponentDefinition<typeof GetKnowledgeContextMacro> = {
  nameSpace: 'kb',
  name: 'get_knowledge_context',
  version: '1.0.0',
  component: GetKnowledgeContextMacro,
  description: 'Get relevant knowledge context for answering a question or topic',
  alias: 'get_knowledge_context',
  runat: 'server',
  icon: 'psychology',
  roles: ['USER', 'ANON'],
  tools: [
    {
      type: 'function',
      roles: ['USER', 'ANON'],
      function: {
        icon: 'psychology',
        name: 'get_knowledge_context',
        description: 'Retrieve relevant articles and context information to help answer questions or understand a topic',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The question or topic to get context for',
            },
            kbId: {
              type: 'string',
              description: 'Limit context to specific knowledge base',
            },
            language: {
              type: 'string',
              description: 'Preferred language for content',
              default: 'en',
            },
          },
          required: ['query'],
        },
      },
    },
  ],
};

export default GetKnowledgeContextMacroDefinition;
