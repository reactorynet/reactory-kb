/**
 * Edit Article Form Schema
 * Extends CreateArticle schema with additional fields for editing
 */

const EditArticleSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  required: ['id', 'title', 'content', 'lng'],
  properties: {
    id: {
      type: 'string',
      title: 'Article ID',
      description: 'Unique identifier for the article',
    },
    title: {
      type: 'string',
      title: 'Title',
      description: 'The article title',
      minLength: 3,
      maxLength: 300,
    },
    content: {
      type: 'string',
      title: 'Content',
      description: 'The main article content in Markdown format',
      minLength: 100,
    },
    description: {
      type: 'string',
      title: 'Summary',
      description: 'A brief summary of the article',
      maxLength: 500,
    },
    lng: {
      type: 'string',
      title: 'Language',
      description: 'The language of this article',
      enum: ['en', 'fr', 'es', 'pt', 'de', 'it', 'ja', 'zh'],
      enumNames: ['English', 'Français', 'Español', 'Português', 'Deutsch', 'Italiano', '日本語', '中文'],
    },
    tags: {
      type: 'array',
      title: 'Tags',
      description: 'Tags for categorizing this article',
      items: {
        type: 'string',
      },
    },
    categories: {
      type: 'array',
      title: 'Categories',
      description: 'Categories this article belongs to',
      items: {
        type: 'string',
      },
    },
    status: {
      type: 'string',
      title: 'Status',
      description: 'Publication status',
      enum: ['draft', 'under_review', 'published', 'archived'],
      enumNames: ['Draft', 'Under Review', 'Published', 'Archived'],
    },
    changeSummary: {
      type: 'string',
      title: 'Change Summary',
      description: 'Brief description of changes made in this version',
      maxLength: 200,
    },
    localizedContent: {
      type: 'array',
      title: 'Localized Content',
      description: 'Translations of this article',
      items: {
        type: 'object',
        properties: {
          lng: {
            type: 'string',
            title: 'Language',
            enum: ['en', 'fr', 'es', 'pt', 'de', 'it', 'ja', 'zh'],
          },
          title: {
            type: 'string',
            title: 'Title',
          },
          content: {
            type: 'string',
            title: 'Content',
          },
          summary: {
            type: 'string',
            title: 'Summary',
          },
          published: {
            type: 'boolean',
            title: 'Published',
            default: false,
          },
        },
        required: ['lng', 'title', 'content'],
      },
    },
  },
};

export default EditArticleSchema;

