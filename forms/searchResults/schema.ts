/**
 * Search Results Form Schema
 */

const SearchResultsSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      title: 'Search Query',
    },
    results: {
      type: 'array',
      title: 'Search Results',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          contentType: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          author: { type: 'object' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          categories: {
            type: 'array',
            items: { type: 'string' },
          },
          lng: { type: 'string' },
          status: { type: 'string' },
          relevanceScore: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    total: {
      type: 'number',
      title: 'Total Results',
      description: 'Total number of matching results',
    },
    page: {
      type: 'number',
      title: 'Current Page',
      default: 1,
      minimum: 1,
    },
    limit: {
      type: 'number',
      title: 'Results Per Page',
      default: 20,
      minimum: 1,
      maximum: 100,
    },
    facets: {
      type: 'object',
      title: 'Facets',
      description: 'Aggregated search metadata',
      properties: {
        contentTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        authors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
      },
    },
    filters: {
      type: 'object',
      title: 'Active Filters',
      properties: {
        contentType: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        lng: { type: 'string' },
        status: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
      },
    },
    sortBy: {
      type: 'string',
      title: 'Sort By',
      enum: ['relevance', 'date_desc', 'date_asc', 'title_asc', 'title_desc'],
      enumNames: ['Relevance', 'Newest First', 'Oldest First', 'Title (A-Z)', 'Title (Z-A)'],
      default: 'relevance',
    },
  },
};

export default SearchResultsSchema;

