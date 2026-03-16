/**
 * List Knowledge Bases Macro
 * 
 * AI tool for listing available knowledge bases
 */

import Reactory from '@reactorynet/reactory-core';

export const ListKnowledgeBasesMacro: Reactory.AI.MacroToolDefinition = {
  name: 'list_knowledge_bases',
  description: 'List all available knowledge bases with optional filtering',
  type: 'function',
  function: {
    name: 'list_knowledge_bases',
    description: 'Get a list of knowledge bases that the user has access to',
    parameters: {
      type: 'object',
      properties: {
        visibility: {
          type: 'string',
          enum: ['private', 'public', 'shared', 'organization'],
          description: 'Filter by visibility setting',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 20,
        },
      },
    },
  },
  roles: ['USER', 'ANON'],
  runat: 'server',
  handler: async (params: any, context: Reactory.Server.IReactoryContext) => {
    const kbService = context.services.kb?.KnowledgeBaseService;
    
    if (!kbService) {
      throw new Error('KnowledgeBaseService not available');
    }

    const kbs = await kbService.listKnowledgeBases({
      visibility: params.visibility,
      tags: params.tags,
      limit: params.limit || 20,
    });

    return {
      success: true,
      data: kbs.map(kb => ({
        id: kb.id,
        slug: kb.slug,
        title: kb.title,
        description: kb.description,
        visibility: kb.visibility,
        tags: kb.tags,
        createdAt: kb.createdAt,
      })),
      message: `Found ${kbs.length} knowledge bases`,
      instructions: `## Knowledge Bases (${kbs.length})\n\n${kbs.length === 0 ? 'No knowledge bases found.' : kbs.map(kb => `- **${kb.title}** (${kb.id}) \u2014 ${kb.visibility}`).join('\n')}\n\n### Suggested Next Steps:\n${kbs.length === 0 ? '- Use \`create_knowledge_base\` to create one' : '- Use \`get_knowledge_base\` with an ID to see details\n- Use \`search_kb_articles\` with kbId to search within a KB'}`
    };
  },
};

export default ListKnowledgeBasesMacro;

