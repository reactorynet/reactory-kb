/**
 * Get Knowledge Base Macro
 *
 * AI tool for retrieving knowledge base information.
 * Conforms to the standard reactor macro/tool implementation: a `component`
 * function of shape `Macro<TResult, TParams>` plus a `MacroComponentDefinition`
 * registry entry. Services are resolved from `state.context.getService(...)`.
 */

import { ChatState, MacroComponentDefinition } from '@reactory/server-modules/reactory-reactor/ai/openai/types/chat';
import { IKnowledgeBaseService } from '@reactory/server-modules/reactory-kb/services/KnowledgeBaseService';

export interface GetKnowledgeBaseMacroParams {
  /** The ID of the knowledge base */
  id?: string;
  /** The slug of the knowledge base */
  slug?: string;
}

const GetKnowledgeBaseMacro = async (
  params: GetKnowledgeBaseMacroParams,
  state: ChatState,
) => {
  const { context } = state;
  const { id, slug } = params;

  if (!id && !slug) {
    return {
      success: false,
      error: 'Either id or slug must be provided',
      tool: 'get_knowledge_base',
      params,
      instructions: `## Get Knowledge Base — Missing Parameter\n\nProvide either an **id** or a **slug**.\n\n### Recovery Options:\n- Use \`list_knowledge_bases\` to find a valid id or slug`,
    };
  }

  try {
    const kbService = context?.getService<IKnowledgeBaseService>('kb.KnowledgeBaseService@1.0.0');

    if (!kbService) {
      return {
        success: false,
        error: 'KnowledgeBaseService is not available',
        tool: 'get_knowledge_base',
        params,
        instructions: `## Get Knowledge Base — Service Unavailable\n\nThe KnowledgeBaseService is not registered.\n\n### Recovery Options:\n- Use \`svc\` with action="list" to check available services\n- Verify the reactory-kb module is loaded`,
      };
    }

    const kb = id
      ? await kbService.getKnowledgeBase(id)
      : await kbService.getKnowledgeBaseBySlug(slug);

    if (!kb) {
      return {
        success: false,
        error: `Knowledge base not found for ${id ? `id "${id}"` : `slug "${slug}"`}`,
        tool: 'get_knowledge_base',
        params,
        instructions: `## Get Knowledge Base — Not Found\n\nNo knowledge base matches ${id ? `id "${id}"` : `slug "${slug}"`}.\n\n### Recovery Options:\n- Use \`list_knowledge_bases\` to see available knowledge bases`,
      };
    }

    if (!state.vars) state.vars = {};
    state.vars.lastRetrievedKnowledgeBase = kb;

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
      tool: 'get_knowledge_base',
      params,
      message: `Retrieved knowledge base "${kb.title}"`,
      instructions: `## Knowledge Base: ${kb.title}\n\n- **ID**: ${kb.id}\n- **Slug**: ${kb.slug}\n- **Language**: ${kb.lng}\n- **Visibility**: ${kb.visibility}\n- **Tags**: ${(kb.tags || []).join(', ') || 'none'}\n\n### Suggested Next Steps:\n- Use \`search_kb_articles\` with kbId="${kb.id}" to find articles\n- Use \`create_kb_article\` with kbId="${kb.id}" to add content\n- Use \`get_knowledge_context\` with kbId="${kb.id}" for AI-powered context`,
    };
  } catch (error) {
    context?.error?.('Error retrieving knowledge base', { error, params }, 'GetKnowledgeBaseMacro');
    return {
      success: false,
      error: `Failed to retrieve knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'get_knowledge_base',
      params,
      instructions: `## Get Knowledge Base — Error\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n### Recovery Options:\n- Verify the id or slug is valid\n- Use \`list_knowledge_bases\` to find valid identifiers`,
    };
  }
};

export const GetKnowledgeBaseMacroDefinition: MacroComponentDefinition<typeof GetKnowledgeBaseMacro> = {
  nameSpace: 'kb',
  name: 'get_knowledge_base',
  version: '1.0.0',
  component: GetKnowledgeBaseMacro,
  description: 'Get information about a knowledge base by ID or slug',
  alias: 'get_knowledge_base',
  runat: 'server',
  icon: 'library_books',
  roles: ['USER', 'ANON'],
  tools: [
    {
      type: 'function',
      roles: ['USER', 'ANON'],
      function: {
        icon: 'library_books',
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
          anyOf: [{ required: ['id'] }, { required: ['slug'] }],
        },
      },
    },
  ],
};

export default GetKnowledgeBaseMacroDefinition;
