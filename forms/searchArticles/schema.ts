/**
 * Search Articles Form Schema
 */

const SearchArticlesSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'string',
      title: 'Search Query',
      description: 'Enter search terms to find articles',
      minLength: 2,
    },
    filters: {
      type: 'object',
      title: 'Filters',
      description: 'Refine your search results',
      properties: {
        kbId: {
          type: 'string',
          title: 'Knowledge Base',
          description: 'Filter by specific knowledge base',
        },
        tags: {
          type: 'array',
          title: 'Tags',
          description: 'Filter by tags',
          items: {
            type: 'string',
          },
        },
        lng: {
          type: 'string',
          title: 'Language',
          description: 'Filter by language',
          enum: ['en', 'fr', 'es', 'pt', 'de', 'it', 'ja', 'zh'],
        },
        status: {
          type: 'string',
          title: 'Status',
          description: 'Filter by publication status',
          enum: ['draft', 'under_review', 'published', 'archived'],
          enumNames: ['Draft', 'Under Review', 'Published', 'Archived'],
        },
        categories: {
          type: 'array',
          title: 'Categories',
          description: 'Filter by categories',
          items: {
            type: 'string',
          },
        },
      },
    },
    limit: {
      type: 'number',
      title: 'Results Limit',
      description: 'Maximum number of results to return',
      default: 20,
      minimum: 1,
      maximum: 100,
    },
    offset: {
      type: 'number',
      title: 'Offset',
      description: 'Number of results to skip (for pagination)',
      default: 0,
      minimum: 0,
    },
  },
};

export default SearchArticlesSchema;

