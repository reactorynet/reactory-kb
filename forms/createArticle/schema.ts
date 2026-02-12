/**
 * Create Article Form Schema
 */

const CreateArticleSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  required: ['title', 'content', 'lng'],
  properties: {
    kbId: {
      type: 'string',
      title: 'Knowledge Base',
      description: 'The knowledge base this article belongs to',
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
      default: 'en',
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
  },
};

export default CreateArticleSchema;

