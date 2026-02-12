/**
 * View Article Form Schema
 */

const ViewArticleSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      title: 'Article ID',
      description: 'Unique identifier for the article',
    },
    title: {
      type: 'string',
      title: 'Title',
    },
    content: {
      type: 'string',
      title: 'Content',
    },
    description: {
      type: 'string',
      title: 'Summary',
    },
    author: {
      type: 'object',
      title: 'Author',
      properties: {
        id: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
      },
    },
    lng: {
      type: 'string',
      title: 'Language',
    },
    tags: {
      type: 'array',
      title: 'Tags',
      items: { type: 'string' },
    },
    categories: {
      type: 'array',
      title: 'Categories',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    status: {
      type: 'string',
      title: 'Status',
      enum: ['draft', 'under_review', 'published', 'archived'],
    },
    version: {
      type: 'string',
      title: 'Version',
    },
    viewCount: {
      type: 'number',
      title: 'Views',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      title: 'Created',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      title: 'Last Updated',
    },
    attachments: {
      type: 'array',
      title: 'Attachments',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          mimetype: { type: 'string' },
          size: { type: 'number' },
          url: { type: 'string' },
        },
      },
    },
    comments: {
      type: 'array',
      title: 'Comments',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          author: { type: 'object' },
          content: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    localizedContent: {
      type: 'array',
      title: 'Available Languages',
      items: {
        type: 'object',
        properties: {
          lng: { type: 'string' },
          title: { type: 'string' },
          published: { type: 'boolean' },
        },
      },
    },
  },
};

export default ViewArticleSchema;

