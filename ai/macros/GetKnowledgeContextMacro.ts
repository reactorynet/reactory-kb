/**
 * Get Knowledge Context Macro
 * 
 * AI tool for retrieving contextual knowledge for a query
 */

import Reactory from '@reactory/reactory-core';

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
    };
  },
};

export default GetKnowledgeContextMacro;

