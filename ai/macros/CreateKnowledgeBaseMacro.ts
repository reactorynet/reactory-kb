/**
 * Create Knowledge Base Macro
 * 
 * AI tool for creating new knowledge bases
 */

import Reactory from '@reactorynet/reactory-core';

export const CreateKnowledgeBaseMacro: Reactory.AI.MacroToolDefinition = {
  name: 'create_knowledge_base',
  description: 'Create a new knowledge base for organizing articles and content',
  type: 'function',
  function: {
    name: 'create_knowledge_base',
    description: 'Create a new knowledge base with specified title, description, and settings',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the knowledge base',
        },
        description: {
          type: 'string',
          description: 'A brief description of what this knowledge base contains',
        },
        lng: {
          type: 'string',
          description: 'Default language code (e.g., "en", "fr", "es")',
          default: 'en',
        },
        visibility: {
          type: 'string',
          enum: ['private', 'public', 'shared', 'organization'],
          description: 'Visibility setting for the knowledge base',
          default: 'private',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorizing the knowledge base',
        },
      },
      required: ['title'],
    },
  },
  roles: ['USER', 'ADMIN'],
  runat: 'server',
  handler: async (params: any, context: Reactory.Server.IReactoryContext) => {
    const kbService = context.services.kb?.KnowledgeBaseService;
    
    if (!kbService) {
      throw new Error('KnowledgeBaseService not available');
    }

    const kb = await kbService.createKnowledgeBase({
      title: params.title,
      description: params.description,
      lng: params.lng || 'en',
      visibility: params.visibility || 'private',
      tags: params.tags || [],
    });

    return {
      success: true,
      data: {
        id: kb.id,
        slug: kb.slug,
        title: kb.title,
        description: kb.description,
        visibility: kb.visibility,
      },
      message: `Knowledge base "${params.title}" created successfully`,
      instructions: `## Knowledge Base Created\n\n**${params.title}** (ID: ${kb.id}, visibility: ${kb.visibility})\n\n### Suggested Next Steps:\n- Use \`create_kb_article\` with kbId="${kb.id}" to add articles\n- Use \`list_knowledge_bases\` to see all knowledge bases`
    };
  },
};

export default CreateKnowledgeBaseMacro;

