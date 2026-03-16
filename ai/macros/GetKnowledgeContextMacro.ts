/**
 * Get Knowledge Context Macro
 * 
 * AI tool for retrieving contextual knowledge for a query
 */

import Reactory from '@reactorynet/reactory-core';

export const GetKnowledgeContextMacro: Reactory.AI.MacroToolDefinition = {
  name: 'get_knowledge_context',
  description: 'Get relevant knowledge context for answering a question or topic',
  type: 'function',
  function: {
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
  roles: ['USER', 'ANON'],
  runat: 'server',
  handler: async (params: any, context: Reactory.Server.IReactoryContext) => {
    const aiService = context.services.kb?.AIIntegrationService;
    
    if (!aiService) {
      throw new Error('AIIntegrationService not available');
    }

    const knowledgeContext = await aiService.getKnowledgeContext(params.query, params.kbId);

    return {
      success: true,
      data: {
        query: knowledgeContext.query,
        articles: knowledgeContext.content.map(article => ({
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
        availableLanguages: knowledgeContext.localizedVersions.map(lv => lv.lng),
      },
      message: `Retrieved knowledge context for "${params.query}" (confidence: ${(knowledgeContext.confidence * 100).toFixed(0)}%)`,
      instructions: `## Knowledge Context: "${params.query}"\n\nConfidence: **${(knowledgeContext.confidence * 100).toFixed(0)}%** | ${knowledgeContext.content.length} article(s) found\n\n### Top Articles:\n${knowledgeContext.content.slice(0, 5).map(a => `- **${a.title}** (score: ${a.relevanceScore?.toFixed(2) || 'N/A'})`).join('\n')}\n\n${knowledgeContext.knowledgeGaps?.length ? `### Knowledge Gaps:\n${knowledgeContext.knowledgeGaps.map((g: string) => `- ${g}`).join('\n')}` : ''}\n\n### Suggested Next Steps:\n- Use the article data to form a comprehensive answer\n- Use \`search_kb_articles\` for more specific searches\n- Use \`create_kb_article\` to fill any knowledge gaps`
    };
  },
};

export default GetKnowledgeContextMacro;

