/**
 * Get Knowledge Base Macro
 * 
 * AI tool for retrieving knowledge base information
 */

import Reactory from '@reactory/reactory-core';

export const GetKnowledgeBaseMacro: Reactory.AI.MacroToolDefinition = {
  name: 'get_knowledge_base',
  description: 'Get information about a knowledge base by ID or slug',
  type: 'function',
  function: {
    name: 'get_knowledge_base',
    description: 'Retrieve detailed information about a specific knowledge base',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the knowledge base',
        },
        slug: {
          type: 'string',
          description: 'The slug of the knowledge base',
        },
      },
      oneOf: [{ required: ['id'] }, { required: ['slug'] }],
    },
  },
  roles: ['USER', 'ANON'],
  runat: 'server',
  handler: async (params: any, context: Reactory.Server.IReactoryContext) => {
    const kbService = context.services.kb?.KnowledgeBaseService;
    
    if (!kbService) {
      throw new Error('KnowledgeBaseService not available');
    }

    let kb;
    if (params.id) {
      kb = await kbService.getKnowledgeBase(params.id);
    } else if (params.slug) {
      kb = await kbService.getKnowledgeBaseBySlug(params.slug);
    } else {
      throw new Error('Either id or slug must be provided');
    }

    return {
      success: true,
      data: {
        id: kb.id,
        slug: kb.slug,
        title: kb.title,
        description: kb.description,
        lng: kb.lng,
        visibility: kb.visibility,
        tags: kb.tags,
        createdAt: kb.createdAt,
        updatedAt: kb.updatedAt,
      },
      message: `Retrieved knowledge base "${kb.title}"`,
    };
  },
};

export default GetKnowledgeBaseMacro;

