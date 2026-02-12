/**
 * Create Knowledge Base Form Schema
 */

const CreateKnowledgeBaseSchema: Reactory.Schema.IObjectSchema = {
  type: 'object',
  required: ['title', 'lng'],
  properties: {
    title: {
      type: 'string',
      title: 'Title',
      description: 'The name of the knowledge base',
      minLength: 3,
      maxLength: 200,
    },
    description: {
      type: 'string',
      title: 'Description',
      description: 'A brief description of the knowledge base purpose',
      maxLength: 1000,
    },
    lng: {
      type: 'string',
      title: 'Default Language',
      description: 'The primary language for this knowledge base',
      enum: ['en', 'fr', 'es', 'pt', 'de', 'it', 'ja', 'zh'],
      enumNames: ['English', 'Français', 'Español', 'Português', 'Deutsch', 'Italiano', '日本語', '中文'],
      default: 'en',
    },
    visibility: {
      type: 'string',
      title: 'Visibility',
      description: 'Who can access this knowledge base',
      enum: ['private', 'public', 'shared', 'organization'],
      enumNames: ['Private', 'Public', 'Shared', 'Organization'],
      default: 'private',
    },
    tags: {
      type: 'array',
      title: 'Tags',
      description: 'Tags for categorizing the knowledge base',
      items: {
        type: 'string',
      },
    },
  },
};

export default CreateKnowledgeBaseSchema;

