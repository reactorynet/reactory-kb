/**
 * List Knowledge Bases Macro
 *
 * AI tool for listing available knowledge bases. Conforms to the standard
 * reactor macro/tool implementation: a `component` function plus a
 * `MacroComponentDefinition` registry entry, resolving services from
 * `state.context.getService(...)`.
 */

import { ChatState, MacroComponentDefinition } from '@reactory/server-modules/reactory-reactor/ai/openai/types/chat';
import { IKnowledgeBaseService } from '@reactory/server-modules/reactory-kb/services/KnowledgeBaseService';

export interface ListKnowledgeBasesMacroParams {
  /** Filter by visibility setting */
  visibility?: 'private' | 'public' | 'shared' | 'organization';
  /** Filter by tags */
  tags?: string[];
  /** Maximum number of results to return */
  limit?: number;
}

const ListKnowledgeBasesMacro = async (
  params: ListKnowledgeBasesMacroParams,
  state: ChatState,
) => {
  const { context } = state;
  const { visibility, tags, limit = 20 } = params;

  try {
    const kbService = context?.getService<IKnowledgeBaseService>('kb.KnowledgeBaseService@1.0.0');

    if (!kbService) {
      return {
        success: false,
        error: 'KnowledgeBaseService is not available',
        tool: 'list_knowledge_bases',
        params,
        instructions: `## List Knowledge Bases — Service Unavailable\n\nThe KnowledgeBaseService is not registered.\n\n### Recovery Options:\n- Use \`svc\` with action="list" to check available services\n- Verify the reactory-kb module is loaded`,
      };
    }

    const kbs = await kbService.listKnowledgeBases({ visibility, tags, limit });

    if (!state.vars) state.vars = {};
    state.vars.lastKnowledgeBaseList = kbs;

    return {
      success: true,
      data: kbs.map((kb) => ({
        id: kb.id,
        slug: kb.slug,
        title: kb.title,
        description: kb.description,
        visibility: kb.visibility,
        tags: kb.tags,
        createdAt: kb.createdAt,
      })),
      tool: 'list_knowledge_bases',
      params,
      message: `Found ${kbs.length} knowledge bases`,
      instructions: `## Knowledge Bases (${kbs.length})\n\n${kbs.length === 0 ? 'No knowledge bases found.' : kbs.map((kb) => `- **${kb.title}** (${kb.id}) — ${kb.visibility}`).join('\n')}\n\n### Suggested Next Steps:\n${kbs.length === 0 ? '- Use `create_knowledge_base` to create one' : '- Use `get_knowledge_base` with an ID to see details\n- Use `search_kb_articles` with kbId to search within a KB'}`,
    };
  } catch (error) {
    context?.error?.('Error listing knowledge bases', { error, params }, 'ListKnowledgeBasesMacro');
    return {
      success: false,
      error: `Failed to list knowledge bases: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'list_knowledge_bases',
      params,
      instructions: `## List Knowledge Bases — Error\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n### Recovery Options:\n- Retry without filters to list all accessible knowledge bases`,
    };
  }
};

export const ListKnowledgeBasesMacroDefinition: MacroComponentDefinition<typeof ListKnowledgeBasesMacro> = {
  nameSpace: 'kb',
  name: 'list_knowledge_bases',
  version: '1.0.0',
  component: ListKnowledgeBasesMacro,
  description: 'List all available knowledge bases with optional filtering',
  alias: 'list_knowledge_bases',
  runat: 'server',
  icon: 'list',
  roles: ['USER', 'ANON'],
  tools: [
    {
      type: 'function',
      roles: ['USER', 'ANON'],
      function: {
        icon: 'list',
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
    },
  ],
};

export default ListKnowledgeBasesMacroDefinition;
