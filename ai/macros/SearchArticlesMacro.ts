/**
 * Search Articles Macro
 *
 * AI tool for searching knowledge base articles using full-text search.
 * Conforms to the standard reactor macro/tool implementation: a `component`
 * function plus a `MacroComponentDefinition` registry entry, resolving services
 * from `state.context.getService(...)`.
 */

import { ChatState, MacroComponentDefinition } from '@reactory/server-modules/reactory-reactor/ai/openai/types/chat';
import { ISearchService } from '@reactory/server-modules/reactory-kb/services/SearchService';

export interface SearchArticlesMacroParams {
  /** The search query text */
  query: string;
  /** Limit search to specific knowledge base */
  kbId?: string;
  /** Filter by tags */
  tags?: string[];
  /** Filter by language code */
  lng?: string;
  /** Maximum number of results */
  limit?: number;
}

const SearchArticlesMacro = async (
  params: SearchArticlesMacroParams,
  state: ChatState,
) => {
  const { context } = state;
  const { query, kbId, tags, lng, limit = 10 } = params;

  if (!query) {
    return {
      success: false,
      error: 'query is required',
      tool: 'search_kb_articles',
      params,
      instructions: `## Search Articles — Missing Parameter\n\n**query** is required.\n\n### Recovery Options:\n- Provide a search query and retry`,
    };
  }

  try {
    const searchService = context?.getService<ISearchService>('kb.SearchService@1.0.0');

    if (!searchService) {
      return {
        success: false,
        error: 'SearchService is not available',
        tool: 'search_kb_articles',
        params,
        instructions: `## Search Articles — Service Unavailable\n\nThe SearchService is not registered.\n\n### Recovery Options:\n- Use \`svc\` with action="list" to check available services\n- Verify the reactory-kb module is loaded`,
      };
    }

    const results = await searchService.searchArticles({
      query,
      filters: { kbId, tags, lng },
      limit,
    });

    if (!state.vars) state.vars = {};
    state.vars.lastArticleSearch = results;

    return {
      success: true,
      data: {
        total: results.total,
        results: results.results.map((article: any) => ({
          id: article.id,
          title: article.title,
          summary: article.description,
          tags: article.tags,
          slug: article.slug,
          score: article._score,
        })),
      },
      tool: 'search_kb_articles',
      params,
      message: `Found ${results.total} articles matching "${query}"`,
      instructions: `## Search Results: "${query}"\n\n**${results.total}** article(s) found.\n\n${results.results.slice(0, 5).map((a: any) => `- **${a.title}** (${a.id}, score: ${a._score?.toFixed(2) || 'N/A'})`).join('\n')}\n\n### Suggested Next Steps:\n- Use article IDs with \`get_knowledge_context\` for deeper analysis\n- Refine search with tags or kbId filters\n- Use \`create_kb_article\` if the topic is not covered`,
    };
  } catch (error) {
    context?.error?.('Error searching articles', { error, params }, 'SearchArticlesMacro');
    return {
      success: false,
      error: `Failed to search articles: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'search_kb_articles',
      params,
      instructions: `## Search Articles — Error\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n### Recovery Options:\n- Simplify the query or remove filters and retry`,
    };
  }
};

export const SearchArticlesMacroDefinition: MacroComponentDefinition<typeof SearchArticlesMacro> = {
  nameSpace: 'kb',
  name: 'search_kb_articles',
  version: '1.0.0',
  component: SearchArticlesMacro,
  description: 'Search for articles in knowledge bases using full-text search',
  alias: 'search_kb_articles',
  runat: 'server',
  icon: 'search',
  roles: ['USER', 'ANON'],
  tools: [
    {
      type: 'function',
      roles: ['USER', 'ANON'],
      function: {
        icon: 'search',
        name: 'search_kb_articles',
        description: 'Perform a full-text search across knowledge base articles with filtering options',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query text',
            },
            kbId: {
              type: 'string',
              description: 'Limit search to specific knowledge base',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags',
            },
            lng: {
              type: 'string',
              description: 'Filter by language code',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
    },
  ],
};

export default SearchArticlesMacroDefinition;
