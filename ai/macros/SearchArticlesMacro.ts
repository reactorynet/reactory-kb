/**
 * Search Articles Macro
 * 
 * AI tool for searching knowledge base articles
 */

import Reactory from '@reactorynet/reactory-core';

export const SearchArticlesMacro: Reactory.AI.MacroToolDefinition = {
  name: 'search_kb_articles',
  description: 'Search for articles in knowledge bases using full-text search',
  type: 'function',
  function: {
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
  roles: ['USER', 'ANON'],
  runat: 'server',
  handler: async (params: any, context: Reactory.Server.IReactoryContext) => {
    const searchService = context.services.kb?.SearchService;
    
    if (!searchService) {
      throw new Error('SearchService not available');
    }

    const results = await searchService.searchArticles({
      query: params.query,
      filters: {
        kbId: params.kbId,
        tags: params.tags,
        lng: params.lng,
      },
      limit: params.limit || 10,
    });

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
      message: `Found ${results.total} articles matching "${params.query}"`,
    };
  },
};

export default SearchArticlesMacro;

